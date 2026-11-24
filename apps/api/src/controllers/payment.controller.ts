import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import {
  BadRequestError,
  NotFoundError,
} from "../middleware/errorHandler.js";
import { VerifyPaymentInput } from "@dhanvantari/validation";
import { OrderStatus, PaymentStatus } from "@dhanvantari/shared-types";
import { sendOrderConfirmationEmail, sendPaymentFailureEmail, sendPaymentSuccessEmail } from "../lib/email.js";

// POST /api/payment/verify
export async function verifyPayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body as VerifyPaymentInput;

    const useDummyGateway =
      process.env["USE_DUMMY_PAYMENT"] === "true" ||
      !process.env["RAZORPAY_KEY_ID"] ||
      !process.env["RAZORPAY_KEY_SECRET"] ||
      (process.env["RAZORPAY_KEY_ID"] ?? "").includes("placeholder") ||
      (process.env["RAZORPAY_KEY_SECRET"] ?? "").includes("placeholder");

    if (!useDummyGateway) {
      const secret = process.env["RAZORPAY_KEY_SECRET"] ?? "";
      const body = `${razorpayOrderId}|${razorpayPaymentId}`;
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

      if (expectedSignature !== razorpaySignature) {
        throw new BadRequestError("Payment verification failed — invalid signature");
      }
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user!.userId },
      include: { payment: true, user: { select: { email: true, name: true } }, items: true },
    });
    if (!order) throw new NotFoundError("Order");

    if (order.payment?.gatewayOrderId !== razorpayOrderId) {
      throw new BadRequestError("Payment order ID mismatch");
    }

    // Idempotency — if already confirmed, don't process again
    if (order.status === OrderStatus.CONFIRMED) {
      res.json({
        success: true,
        message: "Payment already confirmed",
        data: { orderNumber: order.orderNumber },
      });
      return;
    }

    await prisma.$transaction([
      prisma.payment.update({
        where: { orderId: order.id },
        data: {
          status: PaymentStatus.SUCCESS,
          gatewayPaymentId: razorpayPaymentId,
          gatewaySignature: razorpaySignature,
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.SUCCESS,
          statusHistory: {
            create: {
              status: OrderStatus.CONFIRMED,
              changedBy: "PAYMENT_GATEWAY",
            },
          },
        },
      }),
    ]);

    if (order.user.email) {
      await Promise.all([
        sendPaymentSuccessEmail(order.user.email, { customerName: order.user.name, orderNumber: order.orderNumber, orderId: order.id, amount: Number(order.total), paymentId: razorpayPaymentId }),
        sendOrderConfirmationEmail(order.user.email, {
        orderNumber: order.orderNumber,
        orderId: order.id,
        customerName: order.addressName,
        items: order.items.map((item) => ({ productName: item.productName, quantity: item.quantity, price: Number(item.price), variantName: item.variantName })),
        subtotal: Number(order.subtotal),
        couponDiscount: Number(order.couponDiscount),
        shippingCharge: Number(order.shippingCharge),
        total: Number(order.total),
        paymentMethod: "RAZORPAY",
        addressName: order.addressName,
        addressLine1: order.addressLine1,
        addressLine2: order.addressLine2,
        addressCity: order.addressCity,
        addressState: order.addressState,
        addressPincode: order.addressPincode,
        }),
      ]);
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      data: { orderNumber: order.orderNumber },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/payment/webhook
// Raw body — verified by Razorpay signature
export async function handleWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;
    const secret = process.env["RAZORPAY_WEBHOOK_SECRET"] ?? "";
    const body = req.body as Buffer;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      res.status(400).json({ success: false, message: "Invalid webhook signature" });
      return;
    }

    const event = JSON.parse(body.toString()) as {
      event: string;
      payload: { payment: { entity: { order_id: string; id: string; status: string } } };
    };

    if (event.event === "payment.captured") {
      const { order_id: razorpayOrderId, id: gatewayPaymentId } = event.payload.payment.entity;

      const payment = await prisma.payment.findFirst({
        where: { gatewayOrderId: razorpayOrderId },
        include: { order: { include: { user: { select: { email: true, name: true } }, items: true } } },
      });

      if (payment && payment.order.status === OrderStatus.PENDING_PAYMENT) {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.SUCCESS,
              gatewayPaymentId,
              webhookPayload: event as Prisma.InputJsonValue,
            },
          }),
          prisma.order.update({
            where: { id: payment.orderId },
            data: {
              status: OrderStatus.CONFIRMED,
              paymentStatus: PaymentStatus.SUCCESS,
              statusHistory: {
                create: {
                  status: OrderStatus.CONFIRMED,
                  changedBy: "WEBHOOK",
                },
              },
            },
          }),
        ]);
        if (payment.order.user.email) {
          await Promise.all([
            sendPaymentSuccessEmail(payment.order.user.email, { customerName: payment.order.user.name, orderNumber: payment.order.orderNumber, orderId: payment.order.id, amount: Number(payment.order.total), paymentId: gatewayPaymentId }),
            sendOrderConfirmationEmail(payment.order.user.email, {
            orderNumber: payment.order.orderNumber,
            orderId: payment.order.id,
            customerName: payment.order.addressName,
            items: payment.order.items.map((item) => ({ productName: item.productName, quantity: item.quantity, price: Number(item.price), variantName: item.variantName })),
            subtotal: Number(payment.order.subtotal), couponDiscount: Number(payment.order.couponDiscount), shippingCharge: Number(payment.order.shippingCharge), total: Number(payment.order.total), paymentMethod: "RAZORPAY",
            addressName: payment.order.addressName, addressLine1: payment.order.addressLine1, addressLine2: payment.order.addressLine2, addressCity: payment.order.addressCity, addressState: payment.order.addressState, addressPincode: payment.order.addressPincode,
            }),
          ]);
        }
      }
    }

    if (event.event === "payment.failed") {
      const { order_id: razorpayOrderId } = event.payload.payment.entity;
      const payment = await prisma.payment.findFirst({
        where: { gatewayOrderId: razorpayOrderId },
        include: { order: { include: { user: { select: { email: true, name: true } } } } },
      });
      if (payment) {
        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.FAILED,
              webhookPayload: event as Prisma.InputJsonValue,
            },
          }),
          prisma.order.update({
            where: { id: payment.orderId },
            data: {
              status: OrderStatus.PAYMENT_FAILED,
              paymentStatus: PaymentStatus.FAILED,
              statusHistory: {
                create: {
                  status: OrderStatus.PAYMENT_FAILED,
                  changedBy: "WEBHOOK",
                },
              },
            },
          }),
        ]);
        if (payment.order.user.email) {
          await sendPaymentFailureEmail(payment.order.user.email, { customerName: payment.order.user.name, orderNumber: payment.order.orderNumber, orderId: payment.order.id, amount: Number(payment.amount) });
        }
      }
    }

    // Always respond 200 to Razorpay to acknowledge receipt
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}
