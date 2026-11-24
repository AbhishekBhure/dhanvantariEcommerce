import crypto from "crypto";
import prisma from "./prisma.js";
import { AppError, BadRequestError } from "../middleware/errorHandler.js";
import { hashOtp } from "./phoneOtpCrypto.js";
import logger from "./logger.js";

export type PhoneOtpPurpose = "REGISTRATION" | "PASSWORD_RESET";

const OTP_LIFETIME_MS = 5 * 60 * 1000;
const RESEND_DELAY_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

async function sendSms(phone: string, code: string): Promise<void> {
  const accountSid = process.env["TWILIO_ACCOUNT_SID"];
  const authToken = process.env["TWILIO_AUTH_TOKEN"];
  const fromNumber = process.env["TWILIO_FROM_NUMBER"];
  if (!accountSid || !authToken || !fromNumber) {
    throw new AppError("Twilio SMS is not configured", 503);
  }

  const body = new URLSearchParams({
    To: `+91${phone}`,
    From: fromNumber,
    Body: `Your Dhanvantari verification code is ${code}. It expires in 5 minutes.`,
  });
  let response: Response;
  try {
    response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
        signal: AbortSignal.timeout(10000),
      },
    );
  } catch (error) {
    logger.warn(
      { errorType: error instanceof Error ? error.name : "UnknownError" },
      "Twilio SMS request failed before receiving a response",
    );
    throw new AppError("Could not send the verification SMS. Please try again.", 502);
  }
  if (!response.ok) {
    let twilioErrorCode: number | undefined;
    try {
      const payload = (await response.json()) as { code?: unknown };
      if (typeof payload.code === "number") twilioErrorCode = payload.code;
    } catch {
      // Twilio's response body is diagnostic only; the HTTP status is still logged.
    }
    logger.warn(
      { statusCode: response.status, twilioErrorCode },
      "Twilio rejected phone verification SMS",
    );
    throw new AppError("Could not send the verification SMS. Please try again.", 502);
  }
}

export async function issuePhoneOtp(
  userId: string,
  phone: string,
  purpose: PhoneOtpPurpose,
): Promise<void> {
  const now = new Date();
  const recent = await prisma.phoneVerification.findFirst({
    where: {
      userId,
      phone,
      purpose,
      createdAt: { gt: new Date(now.getTime() - RESEND_DELAY_MS) },
    },
    select: { id: true },
  });
  if (recent) throw new BadRequestError("Wait one minute before requesting another code.");

  const code = crypto.randomInt(1000, 10000).toString();
  const verification = await prisma.phoneVerification.create({
    data: {
      userId,
      phone,
      purpose,
      codeHash: hashOtp(code).toString("hex"),
      expiresAt: new Date(now.getTime() + OTP_LIFETIME_MS),
    },
  });

  try {
    await sendSms(phone, code);
  } catch (error) {
    await prisma.phoneVerification.delete({ where: { id: verification.id } });
    throw error;
  }
}

export const phoneOtpLimits = { maxAttempts: MAX_ATTEMPTS };
