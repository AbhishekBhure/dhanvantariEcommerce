import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthTokenPayload, UserRole } from "@dhanvantari/shared-types";
import { UnauthorizedError, ForbiddenError } from "./errorHandler.js";
import prisma from "../lib/prisma.js";

declare module "express" {
  interface Request {
    user?: AuthTokenPayload & { userId: string };
  }
}

function getTokenFromRequest(req: Request): string | null {
  // Try cookie first (preferred — HTTP-only)
  if (req.cookies?.["access_token"]) {
    return req.cookies["access_token"] as string;
  }
  // Fallback: Authorization header (for mobile / external clients)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const token = getTokenFromRequest(req);
  if (!token) {
    return next(new UnauthorizedError());
  }

  try {
    const secret = process.env["JWT_SECRET"];
    if (!secret) throw new Error("JWT_SECRET not configured");

    const payload = jwt.verify(token, secret) as AuthTokenPayload;
    req.user = {
      ...payload,
      userId: payload.userId,
    };
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const token = getTokenFromRequest(req);
  if (!token) {
    return next();
  }
  try {
    const secret = process.env["JWT_SECRET"];
    if (!secret) return next();
    const payload = jwt.verify(token, secret) as AuthTokenPayload;
    req.user = { ...payload, userId: payload.userId };
  } catch {
    // ignore — optional auth
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.user.role as UserRole)) {
      return next(new ForbiddenError());
    }
    next();
  };
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  return requireRole(UserRole.ADMIN, UserRole.SUPER_ADMIN)(req, res, next);
}

// Verify user account is active before sensitive operations
export async function requireActiveUser(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    return next(new UnauthorizedError());
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { isActive: true },
    });
    if (!user?.isActive) {
      return next(new UnauthorizedError("Account is deactivated"));
    }
    next();
  } catch (err) {
    next(err);
  }
}
