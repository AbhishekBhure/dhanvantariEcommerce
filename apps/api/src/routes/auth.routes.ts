import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { register, login, logout, getMe, verifyEmail, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import {
  resetPasswordWithOtp,
  sendPasswordResetOtp,
  sendRegistrationOtp,
  verifyRegistrationOtp,
} from "../controllers/phoneOtp.controller.js";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  passwordResetOtpSchema,
  phoneOtpRequestSchema,
  phoneOtpVerifySchema,
} from "@dhanvantari/validation";

const router: ReturnType<typeof Router> = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/phone-otp/register/send", validate(phoneOtpRequestSchema), sendRegistrationOtp);
router.post("/phone-otp/register/verify", validate(phoneOtpVerifySchema), verifyRegistrationOtp);
router.post("/phone-otp/password/send", validate(phoneOtpRequestSchema), sendPasswordResetOtp);
router.post("/phone-otp/password/reset", validate(passwordResetOtpSchema), resetPasswordWithOtp);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);

export default router;
