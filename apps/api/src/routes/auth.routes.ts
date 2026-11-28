import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { register, login, logout, getMe, verifyEmail, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import {
  resetPasswordWithOtp,
  sendPasswordResetOtp,
  sendRegistrationOtp as sendPhoneRegistrationOtp,
  verifyRegistrationOtp,
} from "../controllers/phoneOtp.controller.js";
import {
  resetPasswordWithEmailOtp,
  sendPasswordResetEmailOtp,
  sendRegistrationEmailOtp,
  verifyRegistrationEmailOtp,
} from "../controllers/emailOtp.controller.js";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  passwordResetOtpSchema,
  emailOtpRequestSchema,
  emailOtpVerifySchema,
  emailPasswordResetOtpSchema,
  phoneOtpRequestSchema,
  phoneOtpVerifySchema,
} from "@dhanvantari/validation";

const router: ReturnType<typeof Router> = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/email-otp/register/send", validate(phoneOtpRequestSchema), sendRegistrationEmailOtp);
router.post("/email-otp/register/verify", validate(emailOtpVerifySchema), verifyRegistrationEmailOtp);
router.post("/phone-otp/register/send", validate(phoneOtpRequestSchema), sendPhoneRegistrationOtp);
router.post("/phone-otp/register/verify", validate(phoneOtpVerifySchema), verifyRegistrationOtp);
router.post("/phone-otp/password/send", validate(phoneOtpRequestSchema), sendPasswordResetOtp);
router.post("/phone-otp/password/reset", validate(passwordResetOtpSchema), resetPasswordWithOtp);
router.post("/email-otp/password/send", validate(emailOtpRequestSchema), sendPasswordResetEmailOtp);
router.post("/email-otp/password/reset", validate(emailPasswordResetOtpSchema), resetPasswordWithEmailOtp);
router.post("/verify-email", validate(verifyEmailSchema), verifyEmail);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);

export default router;
