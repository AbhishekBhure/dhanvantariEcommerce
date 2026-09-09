import { Router, type Request } from "express";
import prisma from "../../lib/prisma.js";
import { validate } from "../../middleware/validate.js";
import { NotFoundError, BadRequestError } from "../../middleware/errorHandler.js";
import { updateOrderStatusSchema, addShipmentSchema, paginationSchema } from "@dhanvantari/validation";
import { OrderStatus } from "@dhanvantari/shared-types";
import { Prisma } from "@prisma/client";

const router: ReturnType<typeof Router> = Router();

// Valid order status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING_PAYMENT: [],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["OUT_FOR_DELIVERY", "DELIVERED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["RETURN_REQUESTED"],
  PAYMENT_FAILED: ["CANCELLED"],
  CANCELLED: [],
  RETURN_REQUESTED: ["RETURNED"],
  RETURNED: ["REFUNDED"],
  REFUNDED: [],
};

router.get("/", validate(paginationSchema, "query"), async (req, res, next) => {
  try {
    const page = Number(req.query["page"] ?? 1);
    const pageSize = Number(req.query["pageSize"] ?? 20);
    const search = typeof req.query["search"] === "string" ? req.query["search"] : undefined;
    const status = typeof req.query["status"] === "string" ? req.query["status"] : undefined;

    const where: Prisma.OrderWhereInput = {};
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ];
    }
    if (status) where.status = status as OrderStatus;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          paymentMethod: true,
          total: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        orders: orders.map((o) => ({ ...o, total: Number(o.total) })),
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
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        payment: true,
        shipment: true,
        user: { select: { id: true, name: true, email: true, phone: true } },
        statusHistory: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!order) throw new NotFoundError("Order");

    res.json({
      success: true,
      data: {
        order: {
          ...order,
          subtotal: Number(order.subtotal),
          discount: Number(order.discount),
          couponDiscount: Number(order.couponDiscount),
          shippingCharge: Number(order.shippingCharge),
          total: Number(order.total),
          items: order.items.map((i) => ({
            ...i,
            mrp: Number(i.mrp),
            price: Number(i.price),
            total: Number(i.total),
          })),
          payment: order.payment
            ? { ...order.payment, amount: Number(order.payment.amount) }
            : null,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/status", validate(updateOrderStatusSchema), async (req, res, next) => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const { status, notes } = req.body as { status: OrderStatus; notes?: string };
    const authReq = req as Request & { user?: { userId: string } };

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundError("Order");

    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestError(
        `Cannot transition from ${order.status} to ${status}`
      );
    }

    await prisma.order.update({
      where: { id },
      data: {
        status,
        statusHistory: {
          create: {
            status,
            notes,
            changedBy: authReq.user?.userId,
          },
        },
      },
    });

    res.json({ success: true, message: "Order status updated" });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/shipment", validate(addShipmentSchema), async (req, res, next) => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const data = req.body as {
      carrier: string;
      trackingNumber: string;
      trackingUrl?: string | null;
      awbNumber?: string | null;
      estimatedDelivery?: string | null;
    };

    const order = await prisma.order.findUnique({
      where: { id },
      include: { shipment: true },
    });
    if (!order) throw new NotFoundError("Order");

    if (order.shipment) {
      await prisma.shipment.update({
        where: { orderId: id },
        data: {
          ...data,
          estimatedDelivery: data.estimatedDelivery
            ? new Date(data.estimatedDelivery)
            : null,
          status: "CREATED",
        },
      });
    } else {
      await prisma.shipment.create({
        data: {
          orderId: id as string,
          ...data,
          estimatedDelivery: data.estimatedDelivery
            ? new Date(data.estimatedDelivery)
            : null,
          status: "CREATED",
        },
      });
    }

    res.json({ success: true, message: "Shipment information saved" });
  } catch (err) {
    next(err);
  }
});

export default router;
