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
    };

    const coupon = await prisma.coupon.create({
      data: {
        ...data,
        validFrom: new Date(data.validFrom),
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
      },
    });

    res.status(201).json({ success: true, data: { coupon } });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", validate(couponSchema.partial()), async (req, res, next) => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Coupon");

    const data = req.body as Partial<{
      isActive: boolean;
      validUntil: string | null;
      usageLimit: number | null;
    }>;

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...data,
        validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
      },
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
