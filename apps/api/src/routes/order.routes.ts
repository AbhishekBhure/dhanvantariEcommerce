import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createOrderSchema } from "@dhanvantari/validation";
import { createOrder, getMyOrders, getOrderById } from "../controllers/order.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", validate(createOrderSchema), createOrder);
router.get("/", getMyOrders);
router.get("/:id", getOrderById);

export default router;
