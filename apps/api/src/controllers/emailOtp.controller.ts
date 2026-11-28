import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";
import { issueEmailOtp, emailOtpLimits } from "../lib/emailOtp.js";
import { isOtpMatch } from "../lib/phoneOtpCrypto.js";
import { mergeGuestCart } from "../lib/mergeGuestCart.js";
import { sendPasswordChangedEmail } from "../lib/email.js";
import { BadRequestError } from "../middleware/errorHandler.js";
import { AuthTokenPayload, UserRole } from "@dhanvantari/shared-types";
import { COOKIE_OPTIONS, signToken } from "../lib/authSession.js";

type EmailOtpPurpose = "REGISTRATION" | "PASSWORD_RESET";

async function findActiveVerification(
  userId: string,
  email: string,
  purpose: EmailOtpPurpose,
) {
  return prisma.emailVerification.findFirst({
    where: {
      userId,
      email,
      purpose,
      expiresAt: { gt: new Date() },
      consumedAt: null,
      attempts: { lt: emailOtpLimits.maxAttempts },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function recordFailedAttempt(id: string, attempts: number): Promise<void> {
  await prisma.emailVerification.updateMany({
    where: { id, consumedAt: null, attempts: { lt: emailOtpLimits.maxAttempts } },
    data: {
      attempts: { increment: 1 },
      ...(attempts + 1 >= emailOtpLimits.maxAttempts ? { consumedAt: new Date() } : {}),
    },
  });
}

export async function sendRegistrationEmailOtp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { phone } = req.body as { phone: string };
    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true, email: true, name: true, phone: true, emailVerified: true },
    });
    if (!user?.email || user.emailVerified) {
      throw new BadRequestError("This account cannot request email verification.");
    }

    await issueEmailOtp(user.id, user.email, user.name, user.phone, "REGISTRATION");
    res.json({ success: true, message: "A verification code has been sent to your email." });
  } catch (error) {
    next(error);
  }
}

export async function verifyRegistrationEmailOtp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, code } = req.body as { email: string; code: string };
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.emailVerified) {
      throw new BadRequestError("The verification code is invalid or expired.");
    }

    const verification = await findActiveVerification(user.id, email, "REGISTRATION");
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
      const consumed = await tx.emailVerification.updateMany({
        where: {
          id: verification.id,
          consumedAt: null,
          verifiedAt: null,
          expiresAt: { gt: new Date() },
          attempts: { lt: emailOtpLimits.maxAttempts },
        },
        data: { verifiedAt: new Date(), consumedAt: new Date() },
      });
      if (consumed.count !== 1) {
        throw new BadRequestError("The verification code is invalid or expired.");
      }
      return tx.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
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

export async function sendPasswordResetEmailOtp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email } = req.body as { email: string };
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, phone: true, isActive: true },
    });
    if (user?.email && user.isActive) {
      await issueEmailOtp(user.id, user.email, user.name, user.phone, "PASSWORD_RESET");
    }
    res.json({
      success: true,
      message: "If an account exists for this email, a verification code has been sent.",
    });
  } catch (error) {
    next(error);
  }
}

export async function resetPasswordWithEmailOtp(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, code, password } = req.body as {
      email: string;
      code: string;
      password: string;
    };
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, isActive: true },
    });
    if (!user?.isActive) {
      throw new BadRequestError("The verification code is invalid or expired.");
    }

    const verification = await findActiveVerification(user.id, email, "PASSWORD_RESET");
    if (!verification || !isOtpMatch(code, verification.codeHash)) {
      if (verification) await recordFailedAttempt(verification.id, verification.attempts);
      throw new BadRequestError("The verification code is invalid or expired.");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.$transaction(async (tx) => {
      const consumed = await tx.emailVerification.updateMany({
        where: {
          id: verification.id,
          userId: user.id,
          email,
          purpose: "PASSWORD_RESET",
          consumedAt: null,
          verifiedAt: null,
          expiresAt: { gt: new Date() },
          attempts: { lt: emailOtpLimits.maxAttempts },
        },
        data: { verifiedAt: new Date(), consumedAt: new Date() },
      });
      if (consumed.count !== 1) {
        throw new BadRequestError("The verification code is invalid or expired.");
      }
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash, emailVerified: true, passwordResetToken: null, passwordResetExpiry: null },
      });
    });

    if (user.email) await sendPasswordChangedEmail(user.email, user.name);
    res.json({ success: true, message: "Password updated. You can now sign in." });
  } catch (error) {
    next(error);
  }
}
