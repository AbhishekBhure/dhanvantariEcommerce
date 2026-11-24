import { Router, type Request } from "express";
import prisma from "../../lib/prisma.js";
import { validate } from "../../middleware/validate.js";
import { NotFoundError, BadRequestError, ConflictError } from "../../middleware/errorHandler.js";
import {
  updateOrderStatusSchema,
  addShipmentSchema,
  paginationSchema,
  codCollectionSchema,
  indiaPostBookingSchema,
} from "@dhanvantari/validation";
import { OrderStatus, PaymentStatus, ShipmentStatus } from "@dhanvantari/shared-types";
import { Prisma } from "@prisma/client";
import {
  bookIndiaPostCodParcel,
  generateIndiaPostLabel,
  IndiaPostRequestError,
  trackIndiaPostBarcode,
} from "../../lib/indiaPost.js";
import { sendPaymentSuccessEmail } from "../../lib/email.js";

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
          shipment: order.shipment
            ? {
                ...order.shipment,
                indiaPostTariff: order.shipment.indiaPostTariff
                  ? Number(order.shipment.indiaPostTariff)
                  : null,
              }
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

    const order = await prisma.order.findUnique({ where: { id }, include: { shipment: true } });
    if (!order) throw new NotFoundError("Order");
    if (
      status === OrderStatus.CANCELLED &&
      ["BOOKING", "BOOKED", "UNKNOWN"].includes(order.shipment?.indiaPostBookingStatus ?? "")
    ) {
      throw new ConflictError("Reconcile or cancel the India Post consignment before cancelling this order.");
    }

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
      if (
        order.shipment.indiaPostBookingStatus === "BOOKED" ||
        order.shipment.indiaPostBookingStatus === "UNKNOWN" ||
        order.shipment.indiaPostBookingStatus === "BOOKING"
      ) {
        throw new ConflictError("Manage this India Post shipment through the India Post tracking controls.");
      }
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

router.post("/:id/india-post/book", validate(indiaPostBookingSchema), async (req, res, next) => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const input = req.body as {
      barcode: string;
      physicalWeight: number;
      length: number;
      breadth: number;
      height: number;
      shape: "NROL" | "ROLL";
    };
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        payment: true,
        shipment: true,
        user: { select: { email: true } },
      },
    });
    if (!order) throw new NotFoundError("Order");
    if (order.paymentMethod !== "COD") throw new BadRequestError("India Post COD booking is only available for COD orders.");
    if (order.status !== OrderStatus.PACKED) throw new BadRequestError("Pack the order before booking it with India Post.");

    const shipment = order.shipment;
    if (shipment?.carrier && shipment.carrier !== "India Post") {
      throw new ConflictError("This order already has a shipment with another carrier.");
    }
    if (shipment?.indiaPostBookingStatus === "BOOKED") {
      throw new ConflictError("This order has already been booked with India Post.");
    }
    if (shipment?.indiaPostBookingStatus === "BOOKING" || shipment?.indiaPostBookingStatus === "UNKNOWN") {
      throw new ConflictError("The previous India Post booking result must be reconciled before another attempt.");
    }
    const barcodeShipment = await prisma.shipment.findUnique({
      where: { indiaPostBarcode: input.barcode },
      select: { orderId: true },
    });
    if (barcodeShipment && barcodeShipment.orderId !== order.id) {
      throw new ConflictError("This India Post barcode is already assigned to another order.");
    }

    if (shipment) {
      const claimed = await prisma.shipment.updateMany({
        where: {
          orderId: order.id,
          indiaPostBookingStatus: { in: ["NOT_BOOKED", "FAILED"] },
        },
        data: {
          carrier: "India Post",
          trackingNumber: input.barcode,
          awbNumber: input.barcode,
          indiaPostBarcode: input.barcode,
          indiaPostBookingStatus: "BOOKING",
          indiaPostBookingReference: null,
          indiaPostPhysicalWeight: input.physicalWeight,
          indiaPostLength: input.length,
          indiaPostBreadth: input.breadth,
          indiaPostHeight: input.height,
          indiaPostShape: input.shape,
          indiaPostLastEvent: null,
        },
      });
      if (claimed.count !== 1) throw new ConflictError("Another India Post booking attempt is already in progress.");
    } else {
      await prisma.shipment.create({
          data: {
            orderId: order.id,
            carrier: "India Post",
            status: ShipmentStatus.PENDING,
            trackingNumber: input.barcode,
            awbNumber: input.barcode,
            indiaPostBarcode: input.barcode,
            indiaPostBookingStatus: "BOOKING",
            indiaPostPhysicalWeight: input.physicalWeight,
            indiaPostLength: input.length,
            indiaPostBreadth: input.breadth,
            indiaPostHeight: input.height,
            indiaPostShape: input.shape,
          },
        });
    }

    let result: Awaited<ReturnType<typeof bookIndiaPostCodParcel>>;
    try {
      result = await bookIndiaPostCodParcel({
        ...input,
        orderNumber: order.orderNumber,
        total: Number(order.total),
        recipientName: order.addressName,
        recipientPhone: order.addressPhone,
        recipientEmail: order.user.email ?? "",
        addressLine1: order.addressLine1,
        addressLine2: order.addressLine2,
        city: order.addressCity,
        state: order.addressState,
        pincode: order.addressPincode,
      });
    } catch (error) {
      await prisma.shipment.update({
        where: { orderId: order.id },
        data: {
          indiaPostBookingStatus:
            error instanceof IndiaPostRequestError && error.outcomeUnknown ? "UNKNOWN" : "FAILED",
        },
      });
      throw error;
    }

    const bookedShipment = await prisma.shipment.update({
      where: { orderId: order.id },
      data: {
        status: ShipmentStatus.CREATED,
        indiaPostBookingStatus: "BOOKED",
        indiaPostBookingReference: result.bookingReference,
        indiaPostTariff: result.tariff,
        indiaPostLastEvent: "Article booked",
        indiaPostLastSyncAt: new Date(),
      },
    });
    res.status(201).json({
      success: true,
      message: "India Post COD parcel booked successfully.",
      data: {
        barcode: bookedShipment.indiaPostBarcode,
        bookingReference: bookedShipment.indiaPostBookingReference,
        tariff: result.tariff,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/india-post/track", async (req, res, next) => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const order = await prisma.order.findUnique({
      where: { id },
      include: { shipment: true },
    });
    if (!order) throw new NotFoundError("Order");
    const barcode = order.shipment?.indiaPostBarcode;
    if (!barcode) throw new BadRequestError("This order has no India Post barcode to track.");

    const tracking = await trackIndiaPostBarcode(barcode);
    if (!tracking) throw new NotFoundError("India Post tracking record");
    const events = tracking.tracking_details ?? [];
    const latestEvent = events[0];
    const eventText = latestEvent?.event ?? "";
    const normalizedEvent = `${eventText} ${latestEvent?.remarks ?? ""}`.toLowerCase();
    const delivered =
      Boolean(tracking.booking_details?.delivery_confirmed_on) ||
      tracking.del_status?.del_status?.toLowerCase() === "delivered" ||
      /\b(item delivered|delivered to addressee|delivered to recipient|delivery confirmed)\b/.test(normalizedEvent);
    let shipmentStatus: ShipmentStatus | null = null;
    if (delivered) shipmentStatus = ShipmentStatus.DELIVERED;
    else if (latestEvent?.rts || normalizedEvent.includes("return to sender") || normalizedEvent.includes("returned")) {
      shipmentStatus = ShipmentStatus.RETURNED;
    } else if (normalizedEvent.includes("taken out for delivery") || normalizedEvent.includes("out for delivery")) {
      shipmentStatus = ShipmentStatus.OUT_FOR_DELIVERY;
    } else if (normalizedEvent.includes("non delivery") || normalizedEvent.includes("delivery failed")) {
      shipmentStatus = ShipmentStatus.FAILED_DELIVERY;
    } else if (
      normalizedEvent.includes("item dispatched") ||
      normalizedEvent.includes("item received") ||
      normalizedEvent.includes("bag received") ||
      normalizedEvent.includes("bag dispatched") ||
      normalizedEvent.includes("item booked")
    ) {
      shipmentStatus = ShipmentStatus.IN_TRANSIT;
    }

    const orderStatus =
      shipmentStatus === ShipmentStatus.DELIVERED &&
      ["PACKED", "SHIPPED", "OUT_FOR_DELIVERY"].includes(order.status)
        ? OrderStatus.DELIVERED
        : shipmentStatus === ShipmentStatus.RETURNED &&
          ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status)
          ? OrderStatus.RETURNED
        : shipmentStatus === ShipmentStatus.OUT_FOR_DELIVERY && order.status === OrderStatus.SHIPPED
          ? OrderStatus.OUT_FOR_DELIVERY
          : shipmentStatus === ShipmentStatus.IN_TRANSIT && order.status === OrderStatus.PACKED
            ? OrderStatus.SHIPPED
            : null;

    await prisma.$transaction(async (tx) => {
      await tx.shipment.update({
        where: { orderId: order.id },
        data: {
          ...(shipmentStatus ? { status: shipmentStatus } : {}),
          ...(delivered ? { deliveredAt: new Date() } : {}),
          indiaPostBookingStatus: "BOOKED",
          indiaPostLastEvent: eventText || tracking.del_status?.del_status || "Tracking updated",
          indiaPostLastSyncAt: new Date(),
        },
      });
      if (orderStatus) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: orderStatus,
            statusHistory: {
              create: {
                status: orderStatus,
                notes: `India Post tracking: ${eventText || tracking.del_status?.del_status || "status updated"}`,
                changedBy: "INDIA_POST",
              },
            },
          },
        });
      }
    });
    res.json({
      success: true,
      data: {
        barcode,
        shipmentStatus: shipmentStatus ?? order.shipment?.status,
        latestEvent: eventText || tracking.del_status?.del_status || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/india-post/label", async (req, res, next) => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const order = await prisma.order.findUnique({
      where: { id },
      include: { shipment: true },
    });
    if (!order) throw new NotFoundError("Order");
    const shipment = order.shipment;
    if (
      order.paymentMethod !== "COD" ||
      shipment?.indiaPostBookingStatus !== "BOOKED" ||
      !shipment.indiaPostBarcode
    ) {
      throw new BadRequestError("Generate a label only after India Post confirms the parcel booking.");
    }
    if (
      shipment.indiaPostPhysicalWeight === null ||
      shipment.indiaPostLength === null ||
      shipment.indiaPostBreadth === null ||
      shipment.indiaPostHeight === null ||
      !shipment.indiaPostShape
    ) {
      throw new BadRequestError("The India Post parcel measurements are missing; review the booking record.");
    }

    const label = await generateIndiaPostLabel({
      barcode: shipment.indiaPostBarcode,
      physicalWeight: shipment.indiaPostPhysicalWeight,
      length: Number(shipment.indiaPostLength),
      breadth: Number(shipment.indiaPostBreadth),
      height: Number(shipment.indiaPostHeight),
      shape: shipment.indiaPostShape === "ROLL" ? "ROLL" : "NROL",
      orderNumber: order.orderNumber,
      total: Number(order.total),
      postageAmount: Number(shipment.indiaPostTariff ?? 0),
      recipientName: order.addressName,
      recipientPhone: order.addressPhone,
      recipientEmail: "",
      addressLine1: order.addressLine1,
      addressLine2: order.addressLine2,
      city: order.addressCity,
      state: order.addressState,
      pincode: order.addressPincode,
    });
    res.json({
      success: true,
      data: {
        filename: `india-post-${shipment.indiaPostBarcode}.pdf`,
        pdfBase64: label.toString("base64"),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/cod-collection", validate(codCollectionSchema), async (req, res, next) => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const { amount, reference } = req.body as { amount: number; reference?: string | null };
    const actor = (req as Request & { user?: { userId: string } }).user?.userId;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { payment: true, shipment: true, user: { select: { email: true, name: true } } },
    });
    if (!order) throw new NotFoundError("Order");
    if (order.paymentMethod !== "COD") throw new BadRequestError("COD collection can only be recorded for COD orders.");
    if (
      order.status !== OrderStatus.DELIVERED ||
      order.shipment?.status !== ShipmentStatus.DELIVERED ||
      order.shipment.indiaPostBookingStatus !== "BOOKED"
    ) {
      throw new BadRequestError("COD collection can only be recorded after India Post confirms delivery.");
    }
    if (!order.payment || order.payment.status !== PaymentStatus.PENDING) {
      throw new ConflictError("This order has no pending COD payment.");
    }
    if (Math.round(amount * 100) !== Math.round(Number(order.total) * 100)) {
      throw new BadRequestError("Collected amount must exactly match the order total.");
    }
    const collectedAt = new Date();
    await prisma.$transaction(async (tx) => {
      const updated = await tx.payment.updateMany({
        where: { orderId: order.id, status: PaymentStatus.PENDING },
        data: {
          status: PaymentStatus.SUCCESS,
          codCollectedAt: collectedAt,
          codCollectedBy: actor ?? null,
          codCollectionReference: reference?.trim() || null,
        },
      });
      if (updated.count !== 1) throw new ConflictError("COD collection has already been recorded.");
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: OrderStatus.DELIVERED,
          notes: `COD collection confirmed by admin${reference ? ` (reference: ${reference.trim()})` : ""}.`,
          changedBy: actor ?? "ADMIN",
        },
      });
    });

    if (order.user.email) {
      await sendPaymentSuccessEmail(order.user.email, {
        customerName: order.user.name,
        orderNumber: order.orderNumber,
        orderId: order.id,
        amount,
        paymentId: "India Post COD collection recorded",
        paymentLabel: "Collection Reference",
      });
    }
    res.json({ success: true, message: "COD collection recorded." });
  } catch (err) {
    next(err);
  }
});

export default router;
