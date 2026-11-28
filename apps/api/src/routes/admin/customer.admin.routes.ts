import { Router } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma.js";
import { validate } from "../../middleware/validate.js";
import { ConflictError, NotFoundError } from "../../middleware/errorHandler.js";
import { paginationSchema } from "@dhanvantari/validation";

const router: ReturnType<typeof Router> = Router();

router.get("/", validate(paginationSchema, "query"), async (req, res, next) => {
  try {
    const page = Number(req.query["page"] ?? 1);
    const pageSize = Number(req.query["pageSize"] ?? 20);
    const search = typeof req.query["search"] === "string" ? req.query["search"] : undefined;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
          role: "CUSTOMER" as const,
        }
      : { role: "CUSTOMER" as const };

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        customers,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const customer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        lastLoginAt: true,
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            total: true,
            createdAt: true,
          },
        },
        addresses: true,
      },
    });

    if (!customer) {
      res.status(404).json({ success: false, message: "Customer not found" });
      return;
    }

    res.json({
      success: true,
      data: {
        customer: {
          ...customer,
          orders: customer.orders.map((o) => ({ ...o, total: Number(o.total) })),
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/customers/:id/status — activate/deactivate
router.patch("/:id/status", async (req, res, next) => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const { isActive } = req.body as { isActive: boolean };
    await prisma.user.update({
      where: { id },
      data: { isActive },
    });
    res.json({ success: true, message: `Customer ${isActive ? "activated" : "deactivated"}` });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    await prisma.$transaction(async (tx) => {
      const customer = await tx.user.findUnique({
        where: { id },
        select: { role: true, _count: { select: { orders: true } } },
      });

      if (!customer || customer.role !== "CUSTOMER") {
        throw new NotFoundError("Customer");
      }
      if (customer._count.orders > 0) {
        throw new ConflictError("Customers with orders cannot be permanently deleted. Deactivate them instead.");
      }

      await tx.review.deleteMany({ where: { userId: id } });
      await tx.couponRedemption.deleteMany({ where: { userId: id } });
      await tx.cart.deleteMany({ where: { userId: id } });
      await tx.user.delete({ where: { id } });
    });

    res.json({ success: true, message: "Customer permanently deleted." });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      next(new ConflictError("This customer has linked records and cannot be deleted. Deactivate them instead."));
      return;
    }
    next(error);
  }
});

export default router;
