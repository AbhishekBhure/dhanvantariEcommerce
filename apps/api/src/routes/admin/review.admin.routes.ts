import { Router } from "express";
import prisma from "../../lib/prisma.js";
import { BadRequestError, NotFoundError } from "../../middleware/errorHandler.js";

const router: ReturnType<typeof Router> = Router();
router.get("/", async (req, res, next) => {
  try {
    const pendingOnly = req.query.pending === "true";
    const reviews = await prisma.review.findMany({ where: pendingOnly ? { isApproved: false } : {}, include: { user: { select: { id: true, name: true, email: true } }, product: { select: { id: true, name: true, slug: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
    res.json({ success: true, data: { reviews } });
  } catch (error) { next(error); }
});
router.patch("/:id", async (req, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    if (typeof req.body.isApproved !== "boolean") throw new BadRequestError("Provide review approval status.");
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Review");
    const review = await prisma.review.update({ where: { id }, data: { isApproved: req.body.isApproved } });
    res.json({ success: true, data: { review } });
  } catch (error) { next(error); }
});
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Review");
    await prisma.review.delete({ where: { id } });
    res.json({ success: true, message: "Review removed" });
  } catch (error) { next(error); }
});
export default router;
