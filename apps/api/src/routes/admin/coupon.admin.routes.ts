import { Router } from "express";
import prisma from "../../lib/prisma.js";
import { validate } from "../../middleware/validate.js";
import { NotFoundError } from "../../middleware/errorHandler.js";
import { couponSchema } from "@dhanvantari/validation";

const router: ReturnType<typeof Router> = Router();

router.get("/", async (_req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { redemptions: true } } },
    });

    res.json({
      success: true,
      data: {
        coupons: coupons.map((c) => ({
          ...c,
          value: Number(c.value),
          minimumOrder: c.minimumOrder ? Number(c.minimumOrder) : null,
          maximumDiscount: c.maximumDiscount ? Number(c.maximumDiscount) : null,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/", validate(couponSchema), async (req, res, next) => {
  try {
    const data = req.body as {
      code: string;
      type: "PERCENTAGE" | "FIXED";
      value: number;
      minimumOrder?: number | null;
      maximumDiscount?: number | null;
      description?: string | null;
      isActive: boolean;
      validFrom: string;
      validUntil?: string | null;
      usageLimit?: number | null;
      perUserLimit?: number | null;
      productRestrictions: string[];
      categoryRestrictions: string[];
    };

    const { productRestrictions, categoryRestrictions, ...couponData } = data;

    const coupon = await prisma.coupon.create({
      data: {
        ...couponData,
        validFrom: new Date(data.validFrom),
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        productRestrictions: {
          create: productRestrictions.map((productId) => ({ productId })),
        },
        categoryRestrictions: {
          create: categoryRestrictions.map((categoryId) => ({ categoryId })),
        },
      },
    });

    res.status(201).json({ success: true, data: { coupon } });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", validate(couponSchema.partial()), async (req, res, next) => {
  try {
    const id = (Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"]) ?? "";
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Coupon");

    const data = req.body as Partial<{
      isActive: boolean;
      validUntil: string | null;
      usageLimit: number | null;
      code: string;
      type: "PERCENTAGE" | "FIXED";
      value: number;
      minimumOrder: number | null;
      maximumDiscount: number | null;
      description: string | null;
      validFrom: string;
      perUserLimit: number | null;
      productRestrictions: string[];
      categoryRestrictions: string[];
    }>;

    const { productRestrictions, categoryRestrictions, ...couponFields } = data;
    const coupon = await prisma.$transaction(async (tx) => {
      if (productRestrictions !== undefined) {
        await tx.couponProductRestriction.deleteMany({ where: { couponId: id } });
        if (productRestrictions.length) {
          await tx.couponProductRestriction.createMany({ data: productRestrictions.map((productId) => ({ couponId: id, productId })) });
        }
      }
      if (categoryRestrictions !== undefined) {
        await tx.couponCategoryRestriction.deleteMany({ where: { couponId: id } });
        if (categoryRestrictions.length) {
          await tx.couponCategoryRestriction.createMany({ data: categoryRestrictions.map((categoryId) => ({ couponId: id, categoryId })) });
        }
      }
      return tx.coupon.update({
        where: { id },
        data: {
          ...couponFields,
          validFrom: couponFields.validFrom ? new Date(couponFields.validFrom) : undefined,
          validUntil: couponFields.validUntil ? new Date(couponFields.validUntil) : couponFields.validUntil,
        },
      });
    });

    res.json({ success: true, data: { coupon } });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Coupon");
    await prisma.coupon.update({ where: { id }, data: { isActive: false } });
    res.json({ success: true, message: "Coupon deactivated" });
  } catch (err) {
    next(err);
  }
});

export default router;
