import { Router, type Request } from "express";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middleware/auth.js";
import { NotFoundError } from "../middleware/errorHandler.js";

const router: ReturnType<typeof Router> = Router();
router.use(authenticate);
const userIdFrom = (req: Request) => (req as Request & { user: { userId: string } }).user.userId;

router.get("/", async (req, res, next) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: userIdFrom(req) },
      include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: { items: items.map((item) => ({ ...item, product: { ...item.product, price: Number(item.product.price), mrp: Number(item.product.mrp), primaryImage: item.product.images[0]?.url ?? null } })) } });
  } catch (error) { next(error); }
});

router.post("/:productId", async (req, res, next) => {
  try {
    const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
    if (!productId) throw new NotFoundError("Product");
    const product = await prisma.product.findFirst({ where: { id: productId, isPublished: true } });
    if (!product) throw new NotFoundError("Product");
    const userId = userIdFrom(req);
    const item = await prisma.wishlistItem.upsert({ where: { userId_productId: { userId, productId } }, create: { userId, productId }, update: {} });
    res.status(201).json({ success: true, data: { item } });
  } catch (error) { next(error); }
});

router.delete("/:productId", async (req, res, next) => {
  try {
    const productId = Array.isArray(req.params.productId) ? req.params.productId[0] : req.params.productId;
    if (!productId) throw new NotFoundError("Product");
    const result = await prisma.wishlistItem.deleteMany({ where: { userId: userIdFrom(req), productId } });
    if (!result.count) throw new NotFoundError("Wishlist item");
    res.json({ success: true, message: "Removed from wishlist" });
  } catch (error) { next(error); }
});

export default router;
