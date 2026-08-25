import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { verifyPaymentSchema } from "@dhanvantari/validation";
import { verifyPayment, handleWebhook } from "../controllers/payment.controller.js";

const router = Router();

// Webhook: raw body (handled in app.ts body parser logic)
router.post("/webhook", handleWebhook);

// Payment verification requires auth
router.post("/verify", authenticate, validate(verifyPaymentSchema), verifyPayment);

export default router;
