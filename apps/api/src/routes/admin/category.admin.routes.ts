import { Router } from "express";
import slugify from "slugify";
import prisma from "../../lib/prisma.js";
import { validate } from "../../middleware/validate.js";
import { NotFoundError } from "../../middleware/errorHandler.js";
import { categorySchema } from "@dhanvantari/validation";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    });
    res.json({ success: true, data: { categories } });
  } catch (err) {
    next(err);
  }
});

router.post("/", validate(categorySchema), async (req, res, next) => {
  try {
    const data = req.body as {
      name: string;
      slug?: string;
      description?: string | null;
      imageUrl?: string | null;
      isPublished: boolean;
      sortOrder: number;
      metaTitle?: string | null;
      metaDescription?: string | null;
    };

    const slug = data.slug ?? slugify(data.name, { lower: true, strict: true });
    const category = await prisma.category.create({ data: { ...data, slug } });
    res.status(201).json({ success: true, data: { category } });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", validate(categorySchema.partial()), async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Category");
    const category = await prisma.category.update({ where: { id }, data: req.body });
    res.json({ success: true, data: { category } });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Category");
    await prisma.category.update({ where: { id }, data: { isPublished: false } });
    res.json({ success: true, message: "Category unpublished" });
  } catch (err) {
    next(err);
  }
});

export default router;
