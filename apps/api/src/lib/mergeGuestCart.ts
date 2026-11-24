import prisma from "./prisma.js";

export async function mergeGuestCart(userId: string, sessionId: string | undefined): Promise<void> {
  const normalizedSessionId = sessionId?.trim();
  if (!normalizedSessionId) return;

  await prisma.$transaction(async (tx) => {
    const guestCart = await tx.cart.findUnique({
      where: { sessionId: normalizedSessionId },
      include: { items: true },
    });
    if (!guestCart || guestCart.items.length === 0) return;

    const userCart = await tx.cart.findUnique({ where: { userId }, include: { items: true } });
    if (!userCart) {
      await tx.cart.update({ where: { id: guestCart.id }, data: { userId, sessionId: null } });
      return;
    }

    for (const guestItem of guestCart.items) {
      const existing = userCart.items.find(
        (item) => item.productId === guestItem.productId && item.variantId === guestItem.variantId,
      );
      if (existing) {
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: Math.min(10, existing.quantity + guestItem.quantity) },
        });
      } else {
        await tx.cartItem.update({ where: { id: guestItem.id }, data: { cartId: userCart.id } });
      }
    }

    await tx.cart.delete({ where: { id: guestCart.id } });
  });
}
