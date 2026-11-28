import crypto from "crypto";
import prisma from "./prisma.js";
import { AppError, BadRequestError } from "../middleware/errorHandler.js";
import { hashOtp } from "./phoneOtpCrypto.js";
import logger from "./logger.js";

export type PhoneOtpPurpose = "REGISTRATION" | "PASSWORD_RESET";

const OTP_LIFETIME_MS = 5 * 60 * 1000;
const RESEND_DELAY_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const TEXTBEE_FALLBACK_STATUSES = new Set([400, 401, 429]);

class TextBeeSmsError extends Error {
  constructor(
    message: string,
    readonly canFallback: boolean,
  ) {
    super(message);
  }
}

function hasTwilioConfig(): boolean {
  return Boolean(
    process.env["TWILIO_ACCOUNT_SID"] &&
      process.env["TWILIO_AUTH_TOKEN"] &&
      process.env["TWILIO_FROM_NUMBER"],
  );
}

async function sendSmsViaTextBee(phone: string, code: string): Promise<void> {
  const apiKey = process.env["TEXTBEE_API_KEY"]?.trim();
  if (!apiKey) {
    logger.warn({ provider: "textbee" }, "TextBee SMS is not configured");
    throw new TextBeeSmsError("TextBee SMS is not configured", true);
  }

  const baseUrl = (
    process.env["TEXTBEE_BASE_URL"] || "https://api.textbee.dev/api/v1"
  ).replace(/\/+$/, "");
  const deviceId = process.env["TEXTBEE_DEVICE_ID"]?.trim();
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/gateway/send-sms`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Your Dhanvantari verification code is ${code}. It expires in 5 minutes.`,
        recipients: [`+91${phone}`],
        ...(deviceId ? { deviceId } : {}),
      }),
      signal: AbortSignal.timeout(20000),
    });
    console.log("TextBee response:", response);
  } catch (error) {
    logger.warn(
      { provider: "textbee", errorType: error instanceof Error ? error.name : "UnknownError" },
      "TextBee SMS request failed without a confirmed response; not retrying through another provider",
    );
    throw new TextBeeSmsError("TextBee SMS request outcome is unknown", false);
  }

  if (!response.ok) {
    const canFallback = TEXTBEE_FALLBACK_STATUSES.has(response.status);
    logger.warn(
      { provider: "textbee", statusCode: response.status, canFallback },
      "TextBee rejected phone verification SMS",
    );
    throw new TextBeeSmsError("TextBee rejected the SMS request", canFallback);
  }
}

async function sendSmsViaTwilio(phone: string, code: string): Promise<void> {
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

export async function sendVerificationSms(phone: string, code: string): Promise<void> {
  try {
    await sendSmsViaTextBee(phone, code);
  } catch (error) {
    if (!(error instanceof TextBeeSmsError)) throw error;
    if (!error.canFallback) {
      throw new AppError("Could not send the verification SMS. Please try again.", 502);
    }
    if (!hasTwilioConfig()) {
      if (!process.env["TEXTBEE_API_KEY"]?.trim()) {
        throw new AppError("TextBee and Twilio SMS are not configured", 503);
      }
      throw new AppError("Could not send the verification SMS. Please try again.", 502);
    }

    logger.warn(
      { primaryProvider: "textbee", fallbackProvider: "twilio" },
      "Using Twilio fallback after TextBee did not accept the SMS",
    );
    await sendSmsViaTwilio(phone, code);
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
    await sendVerificationSms(phone, code);
  } catch (error) {
    await prisma.phoneVerification.delete({ where: { id: verification.id } });
    throw error;
  }
}

export const phoneOtpLimits = { maxAttempts: MAX_ATTEMPTS };
