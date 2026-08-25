import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";
import {
  AppError,
  ConflictError,
  UnauthorizedError,
  NotFoundError,
} from "../middleware/errorHandler.js";
import { AuthTokenPayload, UserRole } from "@dhanvantari/shared-types";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env["NODE_ENV"] === "production",
  sameSite: "lax" as const,
  path: "/",
};

function signToken(payload: AuthTokenPayload): string {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new AppError("JWT_SECRET not configured", 500);
  const expiresIn = (process.env["JWT_EXPIRES_IN"] ?? "7d") as string;
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

async function mergeGuestCart(userId: string, sessionId: string | undefined): Promise<void> {
  const normalizedSessionId = sessionId?.trim();
  if (!normalizedSessionId) return;

  await prisma.$transaction(async (tx) => {
    const guestCart = await tx.cart.findUnique({
      where: { sessionId: normalizedSessionId },
      include: { items: true },
    });
    if (!guestCart || guestCart.items.length === 0) return;

    const userCart = await tx.cart.findUnique({ where: { userId }, include: { items: true } });
    if (!userCart) {
      await tx.cart.update({
        where: { id: guestCart.id },
        data: { userId, sessionId: null },
      });
      return;
    }

    for (const guestItem of guestCart.items) {
      const existingItem = userCart.items.find(
        (item) => item.productId === guestItem.productId && item.variantId === guestItem.variantId,
      );
      if (existingItem) {
        await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: Math.min(10, existingItem.quantity + guestItem.quantity) },
        });
      } else {
        await tx.cartItem.update({
          where: { id: guestItem.id },
          data: { cartId: userCart.id },
        });
      }
    }

    await tx.cart.delete({ where: { id: guestCart.id } });
  });
}

// POST /api/auth/register
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, password, phone } = req.body as {
      name: string;
      email: string;
      password: string;
      phone?: string;
    };

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictError("An account with this email already exists");

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, phone: phone ?? null },
      select: { id: true, email: true, name: true, role: true },
    });

    const payload: AuthTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    };
    const token = signToken(payload);

    await mergeGuestCart(user.id, req.headers["x-session-id"] as string | undefined);

    res.cookie("access_token", token, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
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
    const { email, password } = req.body as { email: string; password: string };

    const user = await prisma.user.findUnique({ where: { email } });
    // Use constant-time comparison to prevent timing attacks
    const dummyHash = "$2a$12$invalidhashinvalidhashinvalidhashinvalidhashinvalidhas";
    const isMatch = user?.passwordHash
      ? await bcrypt.compare(password, user.passwordHash)
      : await bcrypt.compare(password, dummyHash).then(() => false);

    if (!user || !isMatch) {
      throw new UnauthorizedError("Invalid email or password");
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
          role: user.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
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
