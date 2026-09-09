import { Router } from "express";
import { optionalAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  addToCartSchema,
  updateCartItemSchema,
  applyCouponSchema,
} from "@dhanvantari/validation";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  applyCoupon,
} from "../controllers/cart.controller.js";

const router: ReturnType<typeof Router> = Router();

// All cart routes use optionalAuth (guest carts via x-session-id header)
router.use(optionalAuth);

router.get("/", getCart);
router.post("/items", validate(addToCartSchema), addToCart);
router.patch("/items/:itemId", validate(updateCartItemSchema), updateCartItem);
router.delete("/items/:itemId", removeCartItem);
router.delete("/", clearCart);
router.post("/coupon", validate(applyCouponSchema), applyCoupon);

export default router;
