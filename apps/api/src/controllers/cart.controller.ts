import { Request, Response, NextFunction } from "express";
import { Decimal } from "@prisma/client/runtime/library";
import prisma from "../lib/prisma.js";
import {
  BadRequestError,
  NotFoundError,
} from "../middleware/errorHandler.js";
import { AddToCartInput, UpdateCartItemInput, ApplyCouponInput } from "@dhanvantari/validation";

// ─── Helpers ──────────────────────────────────────────────────

async function getOrCreateCart(userId?: string, sessionId?: string) {
  const normalizedSessionId = sessionId?.trim();
  if (!userId && !normalizedSessionId) {
    throw new BadRequestError("userId or sessionId required");
  }

  const whereClause = userId ? { userId } : { sessionId: normalizedSessionId };
  let cart = await prisma.cart.findFirst({
    where: whereClause,
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true, name: true, slug: true, price: true, mrp: true,
              stock: true, isPublished: true,
              images: { where: { sortOrder: 0 }, take: 1 },
            },
          },
          variant: true,
        },
      },
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: userId ? { userId } : { sessionId: normalizedSessionId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true, name: true, slug: true, price: true, mrp: true,
                stock: true, isPublished: true,
                images: { where: { sortOrder: 0 }, take: 1 },
              },
            },
            variant: true,
          },
        },
      },
    });
  }
  return cart;
}

function calculateCartTotals(
  items: Array<{ quantity: number; product: { price: Decimal; mrp: Decimal }; variant: { price: Decimal; mrp: Decimal } | null }>
) {
  let subtotal = 0;
  let mrpTotal = 0;
  for (const item of items) {
    const price = Number(item.variant?.price ?? item.product.price);
    const mrp = Number(item.variant?.mrp ?? item.product.mrp);
    subtotal += price * item.quantity;
    mrpTotal += mrp * item.quantity;
  }
  const discount = Math.max(0, mrpTotal - subtotal);
  return { subtotal, discount, mrpTotal };
}

// GET /api/cart
export async function getCart(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;
    const sessionId = req.headers["x-session-id"] as string | undefined;

    const cart = await getOrCreateCart(userId, sessionId);
    // Filter out unpublished items
    const validItems = cart.items.filter((i) => i.product.isPublished);
    const { subtotal, discount } = calculateCartTotals(validItems);

    res.json({
      success: true,
      data: {
        cart: {
          ...cart,
          items: validItems.map((i) => ({
            ...i,
            product: {
              ...i.product,
              price: Number(i.product.price),
              mrp: Number(i.product.mrp),
              primaryImage: i.product.images[0]?.url ?? null,
            },
            variant: i.variant
              ? { ...i.variant, price: Number(i.variant.price), mrp: Number(i.variant.mrp) }
              : null,
          })),
          subtotal,
          discount,
          shippingCharge: subtotal >= 499 ? 0 : 49,
          total: subtotal + (subtotal >= 499 ? 0 : 49) - discount,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/cart/items
export async function addToCart(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;
    const sessionId = req.headers["x-session-id"] as string | undefined;
    const { productId, variantId, quantity } = req.body as AddToCartInput;

    // Validate product
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, isPublished: true, stock: true, name: true },
    });
    if (!product || !product.isPublished) throw new NotFoundError("Product");

    // Validate variant if provided
    let variantStock = product.stock;
    if (variantId) {
      const variant = await prisma.productVariant.findFirst({
        where: { id: variantId, productId, isAvailable: true },
      });
      if (!variant) throw new NotFoundError("Product variant");
      variantStock = variant.stock;
    }

    if (variantStock < quantity) {
      throw new BadRequestError(
        `Only ${variantStock} units available for "${product.name}"`
      );
    }

    const cart = await getOrCreateCart(userId, sessionId);

    // Upsert cart item
    const existing = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId: variantId ?? null,
      },
    });

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > 10) throw new BadRequestError("Maximum 10 units per product");
      if (newQty > variantStock) {
        throw new BadRequestError(`Only ${variantStock} units available`);
      }
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: variantId ?? null,
          quantity,
        },
      });
    }

    res.json({ success: true, message: "Item added to cart" });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/cart/items/:itemId
export async function updateCartItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;
    const sessionId = req.headers["x-session-id"] as string | undefined;
    const { quantity } = req.body as UpdateCartItemInput;
    const { itemId } = req.params;

    const cart = await getOrCreateCart(userId, sessionId);
    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { product: { select: { stock: true } }, variant: true },
    });
    if (!item) throw new NotFoundError("Cart item");

    const stock = item.variant?.stock ?? item.product.stock;
    if (quantity > stock) {
      throw new BadRequestError(`Only ${stock} units available`);
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    res.json({ success: true, message: "Cart updated" });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/cart/items/:itemId
export async function removeCartItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;
    const sessionId = req.headers["x-session-id"] as string | undefined;
    const { itemId } = req.params;

    const cart = await getOrCreateCart(userId, sessionId);
    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });
    if (!item) throw new NotFoundError("Cart item");

    await prisma.cartItem.delete({ where: { id: itemId } });
    res.json({ success: true, message: "Item removed" });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/cart
export async function clearCart(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;
    const sessionId = req.headers["x-session-id"] as string | undefined;
    const cart = await getOrCreateCart(userId, sessionId);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    res.json({ success: true, message: "Cart cleared" });
  } catch (err) {
    next(err);
  }
}

// POST /api/cart/coupon
export async function applyCoupon(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { code } = req.body as ApplyCouponInput;

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestError("Invalid or inactive coupon code");
    }

    const now = new Date();
    if (coupon.validFrom > now) {
      throw new BadRequestError("Coupon is not yet active");
    }
    if (coupon.validUntil && coupon.validUntil < now) {
      throw new BadRequestError("Coupon has expired");
    }
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestError("Coupon usage limit has been reached");
    }

    res.json({
      success: true,
      message: "Coupon applied",
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
}
