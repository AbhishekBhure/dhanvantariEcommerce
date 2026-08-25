import { Router } from "express";
import prisma from "../lib/prisma.js";
import { BadRequestError } from "../middleware/errorHandler.js";

const router = Router();

// GET /api/coupons/validate/:code - Public coupon check
router.get("/validate/:code", async (req, res, next) => {
  try {
    const code = req.params["code"]?.toUpperCase();
    const coupon = await prisma.coupon.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        type: true,
        value: true,
        minimumOrder: true,
        maximumDiscount: true,
        description: true,
        isActive: true,
        validFrom: true,
        validUntil: true,
        usageLimit: true,
        usageCount: true,
      },
    });

    if (!coupon) {
      throw new BadRequestError("Invalid coupon code");
    }

    const now = new Date();
    if (!coupon.isActive || coupon.validFrom > now) {
      throw new BadRequestError("Coupon is not active");
    }
    if (coupon.validUntil && coupon.validUntil < now) {
      throw new BadRequestError("Coupon has expired");
    }
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestError("Coupon usage limit has been reached");
    }

    res.json({
      success: true,
      data: {
        coupon: {
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          value: Number(coupon.value),
          minimumOrder: coupon.minimumOrder ? Number(coupon.minimumOrder) : null,
          maximumDiscount: coupon.maximumDiscount ? Number(coupon.maximumDiscount) : null,
          description: coupon.description,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
