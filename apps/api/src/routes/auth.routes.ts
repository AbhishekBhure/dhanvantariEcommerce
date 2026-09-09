import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { register, login, logout, getMe } from "../controllers/auth.controller.js";
import { registerSchema, loginSchema } from "@dhanvantari/validation";

const router: ReturnType<typeof Router> = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);

export default router;
