import { Router } from "express";
import prisma from "../../lib/prisma.js";
import { validate } from "../../middleware/validate.js";
import { paginationSchema } from "@dhanvantari/validation";

const router = Router();

router.get("/", validate(paginationSchema, "query"), async (req, res, next) => {
  try {
    const { page, pageSize, search } = req.query as {
      page: number;
      pageSize: number;
      search?: string;
    };

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
    const customer = await prisma.user.findUnique({
      where: { id: req.params["id"] },
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
    const { isActive } = req.body as { isActive: boolean };
    await prisma.user.update({
      where: { id: req.params["id"] },
      data: { isActive },
    });
    res.json({ success: true, message: `Customer ${isActive ? "activated" : "deactivated"}` });
  } catch (err) {
    next(err);
  }
});

export default router;
