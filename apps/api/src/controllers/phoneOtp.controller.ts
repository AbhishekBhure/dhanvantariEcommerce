import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma.js";
import { mergeGuestCart } from "../lib/mergeGuestCart.js";
import { issuePhoneOtp, phoneOtpLimits } from "../lib/phoneOtp.js";
import { isOtpMatch } from "../lib/phoneOtpCrypto.js";
import { BadRequestError } from "../middleware/errorHandler.js";
import { AuthTokenPayload, UserRole } from "@dhanvantari/shared-types";
import { COOKIE_OPTIONS, signToken } from "../lib/authSession.js";

async function findActiveVerification(
  userId: string,
  phone: string,
  purpose: "REGISTRATION" | "PASSWORD_RESET",
) {
  return prisma.phoneVerification.findFirst({
    where: {
      userId,
      phone,
      purpose,
      expiresAt: { gt: new Date() },
      consumedAt: null,
      attempts: { lt: phoneOtpLimits.maxAttempts },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function recordFailedAttempt(id: string, attempts: number): Promise<void> {
  await prisma.phoneVerification.updateMany({
    where: { id, consumedAt: null, attempts: { lt: phoneOtpLimits.maxAttempts } },
    data: {
      attempts: { increment: 1 },
      ...(attempts + 1 >= phoneOtpLimits.maxAttempts ? { consumedAt: new Date() } : {}),
    },
  });
}

export async function sendRegistrationOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone } = req.body as { phone: string };
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user || user.phoneVerified) throw new BadRequestError("This phone number cannot be verified.");
    await issuePhoneOtp(user.id, phone, "REGISTRATION");
    res.json({ success: true, message: "A verification code has been sent." });
  } catch (error) {
    next(error);
  }
}

export async function verifyRegistrationOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone, code } = req.body as { phone: string; code: string };
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user || user.phoneVerified) throw new BadRequestError("The verification code is invalid or expired.");
    const verification = await findActiveVerification(user.id, phone, "REGISTRATION");
    if (!verification || !isOtpMatch(code, verification.codeHash)) {
      if (verification) await recordFailedAttempt(verification.id, verification.attempts);
      throw new BadRequestError("The verification code is invalid or expired.");
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    } satisfies AuthTokenPayload);
    const updatedUser = await prisma.$transaction(async (tx) => {
      const consumed = await tx.phoneVerification.updateMany({
        where: {
          id: verification.id,
          consumedAt: null,
          verifiedAt: null,
          expiresAt: { gt: new Date() },
          attempts: { lt: phoneOtpLimits.maxAttempts },
        },
        data: { verifiedAt: new Date(), consumedAt: new Date() },
      });
      if (consumed.count !== 1) throw new BadRequestError("The verification code is invalid or expired.");
      return tx.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
        select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
      });
    });

    const sessionId = req.headers["x-session-id"];
    await mergeGuestCart(updatedUser.id, Array.isArray(sessionId) ? sessionId[0] : sessionId);
    await prisma.user.update({ where: { id: updatedUser.id }, data: { lastLoginAt: new Date() } });
    res.cookie("access_token", token, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ success: true, data: { user: updatedUser } });
  } catch (error) {
    next(error);
  }
}

export async function sendPasswordResetOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone } = req.body as { phone: string };
    const user = await prisma.user.findUnique({ where: { phone }, select: { id: true, phoneVerified: true, isActive: true } });
    if (user?.phoneVerified && user.isActive) {
      await issuePhoneOtp(user.id, phone, "PASSWORD_RESET");
    }
    res.json({ success: true, message: "If a verified account exists for this number, a code has been sent." });
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordWithOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone, code, password } = req.body as { phone: string; code: string; password: string };
    const user = await prisma.user.findUnique({ where: { phone }, select: { id: true, phoneVerified: true, email: true, name: true } });
    if (!user?.phoneVerified) throw new BadRequestError("The verification code is invalid or expired.");
    const verification = await findActiveVerification(user.id, phone, "PASSWORD_RESET");
    if (!verification || !isOtpMatch(code, verification.codeHash)) {
      if (verification) await recordFailedAttempt(verification.id, verification.attempts);
      throw new BadRequestError("The verification code is invalid or expired.");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction(async (tx) => {
      const consumed = await tx.phoneVerification.updateMany({
        where: {
          id: verification.id,
          userId: user.id,
          phone,
          purpose: "PASSWORD_RESET",
          consumedAt: null,
          verifiedAt: null,
          expiresAt: { gt: new Date() },
          attempts: { lt: phoneOtpLimits.maxAttempts },
        },
        data: { verifiedAt: new Date(), consumedAt: new Date() },
      });
      if (consumed.count !== 1) throw new BadRequestError("The verification code is invalid or expired.");
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash, passwordResetToken: null, passwordResetExpiry: null },
      });
    });
    res.json({ success: true, message: "Password updated. You can now sign in." });
  } catch (error) {
    next(error);
  }
}

