import crypto from "crypto";
import prisma from "./prisma.js";
import { BadRequestError } from "../middleware/errorHandler.js";
import { sendEmailOtp } from "./email.js";
import { hashOtp } from "./phoneOtpCrypto.js";
import { sendVerificationSms } from "./phoneOtp.js";
import logger from "./logger.js";

export type EmailOtpPurpose = "REGISTRATION" | "PASSWORD_RESET";

const OTP_LIFETIME_MS = 5 * 60 * 1000;
const RESEND_DELAY_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

export async function issueEmailOtp(
  userId: string,
  email: string,
  name: string,
  phone: string | null,
  purpose: EmailOtpPurpose,
): Promise<void> {
  const now = new Date();
  const recent = await prisma.emailVerification.findFirst({
    where: {
      userId,
      email,
      purpose,
      createdAt: { gt: new Date(now.getTime() - RESEND_DELAY_MS) },
    },
    select: { id: true },
  });
  if (recent) throw new BadRequestError("Wait one minute before requesting another code.");

  const emailCode = crypto.randomInt(1000, 10000).toString();
  const emailCodeHash = hashOtp(emailCode).toString("hex");
  const emailVerification = await prisma.emailVerification.create({
    data: {
      userId,
      email,
      purpose,
      codeHash: emailCodeHash,
      expiresAt: new Date(now.getTime() + OTP_LIFETIME_MS),
    },
  });

  let phoneVerificationId: string | undefined;
  let smsCode: string | undefined;
  if (phone) {
    do {
      smsCode = crypto.randomInt(1000, 10000).toString();
    } while (smsCode === emailCode);
  }
  try {
    if (phone && smsCode) {
      const phoneVerification = await prisma.phoneVerification.create({
        data: {
          userId,
          phone,
          purpose,
          codeHash: hashOtp(smsCode).toString("hex"),
          expiresAt: new Date(now.getTime() + OTP_LIFETIME_MS),
        },
        select: { id: true },
      });
      phoneVerificationId = phoneVerification.id;
    }

    await sendEmailOtp(email, name, emailCode, purpose);
  } catch (error) {
    await prisma.emailVerification.delete({ where: { id: emailVerification.id } });
    if (phoneVerificationId) {
      await prisma.phoneVerification.delete({ where: { id: phoneVerificationId } });
    }
    throw error;
  }

  if (!phone || !smsCode) return;
  try {
    await sendVerificationSms(phone, smsCode);
  } catch (error) {
    logger.warn(
      { provider: "sms", errorType: error instanceof Error ? error.name : "UnknownError" },
      "SMS OTP send failed; email OTP was sent successfully",
    );
  }
}

export const emailOtpLimits = { maxAttempts: MAX_ATTEMPTS };
