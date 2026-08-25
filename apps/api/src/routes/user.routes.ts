import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { addressSchema, updateProfileSchema } from "@dhanvantari/validation";
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  updateProfile,
} from "../controllers/user.controller.js";

const router = Router();

router.use(authenticate);

router.get("/addresses", getAddresses);
router.post("/addresses", validate(addressSchema), createAddress);
router.put("/addresses/:id", validate(addressSchema), updateAddress);
router.delete("/addresses/:id", deleteAddress);
router.patch("/profile", validate(updateProfileSchema), updateProfile);

export default router;
