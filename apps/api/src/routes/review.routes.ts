import { Router, type Request } from "express";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { BadRequestError, NotFoundError } from "../middleware/errorHandler.js";

const router: ReturnType<typeof Router> = Router();
const userIdFrom = (req: Request) => (req as Request & { user: { userId: string } }).user.userId;

router.post("/products/:productId", authenticate, async (req, res, next) => {
  try {
    const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
    if (!productId) throw new NotFoundError("Product");
    const userId = userIdFrom(req);
    const rating = Number(req.body.rating);
    const title = typeof req.body.title === "string" ? req.body.title.trim() : null;
    const body = typeof req.body.body === "string" ? req.body.body.trim() : null;
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new BadRequestError("Rating must be from 1 to 5 stars.");
    if (!body || body.length < 10 || body.length > 2000) throw new BadRequestError("Review must be between 10 and 2000 characters.");

    const order = await prisma.order.findFirst({
      where: { userId, status: "DELIVERED", items: { some: { productId } } },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (!order) throw new BadRequestError("You can review this product after its order has been delivered.");
    const product = await prisma.product.findFirst({ where: { id: productId, isPublished: true }, select: { id: true } });
    if (!product) throw new NotFoundError("Product");

    const review = await prisma.review.upsert({
      where: { productId_userId_orderId: { productId, userId, orderId: order.id } },
      create: { productId, userId, orderId: order.id, rating, title, body, isApproved: false },
      update: { rating, title, body, isApproved: false },
    });
    res.status(201).json({ success: true, message: "Review submitted for moderation.", data: { review } });
  } catch (error) { next(error); }
});

export default router;
