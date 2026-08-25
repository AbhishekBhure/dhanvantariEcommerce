import { Router } from "express";
import { validate } from "../middleware/validate.js";
import { productFilterSchema } from "@dhanvantari/validation";
import { getProducts, getProductBySlug, getFeaturedProducts } from "../controllers/product.controller.js";

const router = Router();

router.get("/", validate(productFilterSchema, "query"), getProducts);
router.get("/featured", getFeaturedProducts);
router.get("/:slug", getProductBySlug);

export default router;
