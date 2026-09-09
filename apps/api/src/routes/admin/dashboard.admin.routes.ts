import { Router } from "express";
import prisma from "../../lib/prisma.js";

const router: ReturnType<typeof Router> = Router();

// GET /api/admin/dashboard
router.get("/", async (_req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      ordersToday,
      ordersPending,
      revenueToday,
      totalRevenue,
      totalProducts,
      lowStockProducts,
      recentOrders,
      topProducts,
    ] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: today }, status: { not: "PAYMENT_FAILED" } },
      }),
      prisma.order.count({
        where: { status: "CONFIRMED" },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: today },
          paymentStatus: "SUCCESS",
        },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: { paymentStatus: "SUCCESS" },
        _sum: { total: true },
      }),
      prisma.product.count({ where: { isPublished: true } }),
      prisma.product.findMany({
        where: { stock: { lte: 5 }, isPublished: true },
        select: { id: true, name: true, stock: true, slug: true },
        take: 10,
        orderBy: { stock: "asc" },
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
        },
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

    const topProductIds = topProducts.map((p) => p.productId);
    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, slug: true },
    });

    res.json({
      success: true,
      data: {
        ordersToday,
        ordersPending,
        revenueToday: Number(revenueToday._sum.total ?? 0),
        totalRevenue: Number(totalRevenue._sum.total ?? 0),
        totalProducts,
        lowStockProducts,
        recentOrders: recentOrders.map((o) => ({
          ...o,
          total: Number(o.total),
        })),
        topProducts: topProducts.map((tp) => ({
          productId: tp.productId,
          totalSold: tp._sum.quantity,
          product: topProductDetails.find((p) => p.id === tp.productId),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
