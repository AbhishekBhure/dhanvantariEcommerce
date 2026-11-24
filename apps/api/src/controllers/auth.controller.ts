import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from "../middleware/errorHandler.js";
import { AuthTokenPayload, UserRole } from "@dhanvantari/shared-types";
import { sendPasswordChangedEmail, sendPasswordResetEmail, sendWelcomeEmail } from "../lib/email.js";
import { issuePhoneOtp } from "../lib/phoneOtp.js";
import { mergeGuestCart } from "../lib/mergeGuestCart.js";
import { COOKIE_OPTIONS, signToken } from "../lib/authSession.js";

const STOREFRONT_URL = process.env["STOREFRONT_URL"]?.split(",").map((url) => url.trim()).find((url) => url.startsWith("https://")) ?? process.env["STOREFRONT_URL"]?.split(",")[0]?.trim() ?? "http://localhost:3000";

// POST /api/auth/register
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, password, phone } = req.body as {
      name: string;
      email?: string;
      password: string;
      phone: string;
    };

    const normalizedEmail = email?.trim().toLowerCase() || null;
    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) throw new ConflictError("An account with this phone number already exists");
    if (normalizedEmail) {
      const existingEmail = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existingEmail) throw new ConflictError("An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        phone,
      },
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
    });
    try {
      await issuePhoneOtp(user.id, phone, "REGISTRATION");
    } catch (error) {
      await prisma.user.delete({ where: { id: user.id } });
      throw error;
    }

    res.status(201).json({
      success: true,
      message: "Account created. Enter the 4-digit code sent to your phone.",
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, phone, password } = req.body as { email?: string; phone?: string; password: string };

    const user = phone
      ? await prisma.user.findUnique({ where: { phone } })
      : email
        ? await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
        : null;
    // Use constant-time comparison to prevent timing attacks
    const dummyHash = "$2a$12$invalidhashinvalidhashinvalidhashinvalidhashinvalidhas";
    const isMatch = user?.passwordHash
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!user || !isMatch) {
      throw new UnauthorizedError("Invalid phone number or password");
    }

    if (phone && !user.phoneVerified) {
      throw new UnauthorizedError("Please verify your phone number before signing in.");
    }
    if (email && !user.emailVerified) {
      throw new UnauthorizedError("Please verify your email before signing in.");
    }

    if (!user.isActive) {
      throw new UnauthorizedError("Your account has been deactivated. Please contact support.");
    }

    const payload: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    };
    const token = signToken(payload);

    await mergeGuestCart(user.id, req.headers["x-session-id"] as string | undefined);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    res.cookie("access_token", token, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      message: "Logged in successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/verify-email
export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.body as { token: string };
    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token, emailVerificationExpiry: { gt: new Date() } },
    });
    if (!user) throw new BadRequestError("Verification link is invalid or expired.");
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerificationToken: null, emailVerificationExpiry: null },
    });
    if (user.email) await sendWelcomeEmail(user.email, user.name);
    res.json({ success: true, message: "Email verified. You can now sign in." });
  } catch (err) { next(err); }
}

// POST /api/auth/forgot-password
export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body as { email: string };
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user?.passwordHash && user.email && user.emailVerified) {
      const token = crypto.randomBytes(32).toString("hex");
      await prisma.user.update({ where: { id: user.id }, data: { passwordResetToken: token, passwordResetExpiry: new Date(Date.now() + 30 * 60 * 1000) } });
      await sendPasswordResetEmail(user.email, { name: user.name, resetUrl: `${STOREFRONT_URL}/reset-password?token=${token}` });
    }
    res.json({ success: true, message: "If an account exists for that email, password reset instructions have been sent." });
  } catch (err) { next(err); }
}

// POST /api/auth/reset-password
export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, password } = req.body as { token: string; password: string };
    const user = await prisma.user.findFirst({ where: { passwordResetToken: token, passwordResetExpiry: { gt: new Date() } } });
    if (!user) throw new BadRequestError("Password reset link is invalid or expired.");
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash, passwordResetToken: null, passwordResetExpiry: null } });
    if (user.email) await sendPasswordChangedEmail(user.email, user.name);
    res.json({ success: true, message: "Password updated. You can now sign in." });
  } catch (err) { next(err); }
}

// POST /api/auth/logout
export function logout(req: Request, res: Response): void {
  res.clearCookie("access_token", COOKIE_OPTIONS);
  res.json({ success: true, message: "Logged out successfully" });
}

// GET /api/auth/me
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundError("User");
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}
