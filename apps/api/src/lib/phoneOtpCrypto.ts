import crypto from "crypto";
import { AppError } from "../middleware/errorHandler.js";

function getOtpSecret(): string {
  const secret = process.env["OTP_HMAC_SECRET"];
  if (!secret) throw new AppError("OTP_HMAC_SECRET is not configured", 503);
  return secret;
}

export function hashOtp(code: string): Buffer {
  return crypto.createHmac("sha256", getOtpSecret()).update(code).digest();
}

export function isOtpMatch(code: string, codeHash: string): boolean {
  const expected = Buffer.from(codeHash, "hex");
  const actual = hashOtp(code);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}
