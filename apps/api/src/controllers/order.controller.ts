import { Request, Response, NextFunction } from "express";
import { nanoid } from "nanoid";
import Razorpay from "razorpay";
import prisma from "../lib/prisma.js";
import {
  BadRequestError,
  NotFoundError,
  AppError,
} from "../middleware/errorHandler.js";
import { CreateOrderInput } from "@dhanvantari/validation";
import { OrderStatus, PaymentMethod } from "@dhanvantari/shared-types";

const SHIPPING_THRESHOLD = 499;
const SHIPPING_CHARGE = 49;

function isDummyRazorpayEnabled(): boolean {
  const keyId = process.env["RAZORPAY_KEY_ID"] ?? "";
  const keySecret = process.env["RAZORPAY_KEY_SECRET"] ?? "";
  const forceDummy = process.env["USE_DUMMY_PAYMENT"] === "true";

  return forceDummy || !keyId || !keySecret || keyId.includes("placeholder") || keySecret.includes("placeholder");
}

function generateOrderNumber(): string {
  return `DHV-${Date.now()}-${nanoid(6).toUpperCase()}`;
}

async function calculateCouponDiscount(
  couponCode: string | null | undefined,
  subtotal: number,
  userId: string
): Promise<{ discount: number; couponId: string | null }> {
  if (!couponCode) return { discount: 0, couponId: null };

  const coupon = await prisma.coupon.findUnique({
    where: { code: couponCode.toUpperCase() },
  });
  if (!coupon || !coupon.isActive) return { discount: 0, couponId: null };

  const now = new Date();
  if (coupon.validFrom > now || (coupon.validUntil && coupon.validUntil < now)) {
    return { discount: 0, couponId: null };
  }
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return { discount: 0, couponId: null };
  }
  if (coupon.minimumOrder && subtotal < Number(coupon.minimumOrder)) {
    return { discount: 0, couponId: null };
  }

  // Check per-user limit
  if (coupon.perUserLimit !== null) {
    const userUsage = await prisma.couponRedemption.count({
      where: { couponId: coupon.id, userId },
    });
    if (userUsage >= coupon.perUserLimit) return { discount: 0, couponId: null };
  }

  let discount = 0;
  if (coupon.type === "PERCENTAGE") {
    discount = (subtotal * Number(coupon.value)) / 100;
    if (coupon.maximumDiscount) {
      discount = Math.min(discount, Number(coupon.maximumDiscount));
    }
  } else {
    discount = Math.min(Number(coupon.value), subtotal);
  }

  return { discount: Math.round(discount * 100) / 100, couponId: coupon.id };
}

// POST /api/orders
export async function createOrder(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;
    const { addressId, paymentMethod, couponCode, notes } = req.body as CreateOrderInput;

    // Get address and verify ownership
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId },
    });
    if (!address) throw new NotFoundError("Address");

    // Get cart with items
    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                mrp: true,
                stock: true,
                isPublished: true,
                images: { where: { sortOrder: 0 }, take: 1 },
              },
            },
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestError("Your cart is empty");
    }

    // Validate all items
    for (const item of cart.items) {
      if (!item.product.isPublished) {
        throw new BadRequestError(`"${item.product.name}" is no longer available`);
      }
      const stock = item.variant?.stock ?? item.product.stock;
      if (stock < item.quantity) {
        throw new BadRequestError(
          `Insufficient stock for "${item.product.name}". Available: ${stock}`
        );
      }
    }

    // Calculate totals (server-side — never trust client)
    let subtotal = 0;
    for (const item of cart.items) {
      const price = Number(item.variant?.price ?? item.product.price);
      subtotal += price * item.quantity;
    }

    const { discount: couponDiscount, couponId } = await calculateCouponDiscount(
      couponCode,
      subtotal,
      userId
    );

    const shippingCharge = subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_CHARGE;
    const total = Math.max(0, subtotal - couponDiscount + shippingCharge);

    // Create order in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Decrement stock
      for (const item of cart.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }

        await tx.inventoryLog.create({
          data: {
            productId: item.productId,
            variantId: item.variantId ?? null,
            delta: -item.quantity,
            reason: "ORDER_PLACED",
          },
        });
      }

      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          addressId,
          status: OrderStatus.PENDING_PAYMENT,
          paymentMethod: paymentMethod as PaymentMethod,
          subtotal,
          discount: 0,
          couponDiscount,
          shippingCharge,
          total,
          couponCode: couponCode ?? null,
          notes: notes ?? null,
          addressName: address.name,
          addressPhone: address.phone,
          addressLine1: address.line1,
          addressLine2: address.line2 ?? null,
          addressCity: address.city,
          addressState: address.state,
          addressPincode: address.pincode,
          addressCountry: address.country,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId ?? null,
              productName: item.product.name,
              variantName: item.variant?.name ?? null,
              productImageUrl: item.product.images[0]?.url ?? null,
              sku: item.variant?.sku ?? null,
              mrp: Number(item.variant?.mrp ?? item.product.mrp),
              price: Number(item.variant?.price ?? item.product.price),
              quantity: item.quantity,
              total: Number(item.variant?.price ?? item.product.price) * item.quantity,
            })),
          },
          statusHistory: {
            create: { status: OrderStatus.PENDING_PAYMENT, changedBy: "SYSTEM" },
          },
        },
      });

      // Create payment record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          method: paymentMethod as PaymentMethod,
          status: "PENDING",
          amount: total,
          currency: "INR",
        },
      });

      // Increment coupon usage
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usageCount: { increment: 1 } },
        });
        await tx.couponRedemption.create({
          data: { couponId, userId, orderId: newOrder.id },
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    // For Razorpay — create gateway order
    if (paymentMethod === "RAZORPAY") {
      try {
        if (isDummyRazorpayEnabled()) {
          const dummyOrderId = `dummy_order_${order.orderNumber}`;

          await prisma.payment.update({
            where: { orderId: order.id },
            data: { gatewayOrderId: dummyOrderId },
          });

          res.status(201).json({
            success: true,
            message: "Order created with dummy Razorpay mode",
            data: {
              orderId: order.id,
              orderNumber: order.orderNumber,
              razorpayOrderId: dummyOrderId,
              amount: total,
              currency: "INR",
              keyId: "rzp_test_dummy",
              dummyPayment: true,
            },
          });
          return;
        }

        const razorpay = new Razorpay({
          key_id: process.env["RAZORPAY_KEY_ID"] ?? "",
          key_secret: process.env["RAZORPAY_KEY_SECRET"] ?? "",
        });

        const razorpayOrder = await razorpay.orders.create({
          amount: Math.round(total * 100), // paise
          currency: "INR",
          receipt: order.orderNumber,
        });

        await prisma.payment.update({
          where: { orderId: order.id },
          data: { gatewayOrderId: razorpayOrder.id },
        });

        res.status(201).json({
          success: true,
          message: "Order created",
          data: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            razorpayOrderId: razorpayOrder.id,
            amount: total,
            currency: "INR",
            keyId: process.env["RAZORPAY_KEY_ID"],
          },
        });
        return;
      } catch {
        // Rollback stock and order if Razorpay fails
        throw new AppError("Payment gateway error. Please try again.", 502);
      }
    }

    // COD order
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CONFIRMED,
        statusHistory: {
          create: { status: OrderStatus.CONFIRMED, changedBy: "SYSTEM" },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/orders
export async function getMyOrders(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        total: true,
        createdAt: true,
        items: {
          select: {
            productName: true,
            quantity: true,
            productImageUrl: true,
          },
          take: 1,
        },
      },
    });

    res.json({
      success: true,
      data: {
        orders: orders.map((o) => ({ ...o, total: Number(o.total) })),
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/orders/:id
export async function getOrderById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const order = await prisma.order.findFirst({
      where: { id, userId: req.user!.userId },
      include: {
        items: true,
        payment: { select: { method: true, status: true, gatewayPaymentId: true } },
        shipment: true,
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
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
