import jwt from "jsonwebtoken";
import { AuthTokenPayload } from "@dhanvantari/shared-types";
import { AppError } from "../middleware/errorHandler.js";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env["NODE_ENV"] === "production",
  sameSite: process.env["NODE_ENV"] === "production" ? ("none" as const) : ("lax" as const),
  path: "/",
};

export function signToken(payload: AuthTokenPayload): string {
  const secret = process.env["JWT_SECRET"];
  if (!secret) throw new AppError("JWT_SECRET not configured", 500);
  const expiresIn = (process.env["JWT_EXPIRES_IN"] ?? "7d") as string;
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}
