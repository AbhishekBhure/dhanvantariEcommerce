import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";
import { NotFoundError } from "../middleware/errorHandler.js";

// GET /api/categories
export async function getCategories(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const categories = await prisma.category.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        _count: { select: { products: { where: { product: { isPublished: true } } } } },
      },
    });

    res.json({ success: true, data: { categories } });
  } catch (err) {
    next(err);
  }
}

// GET /api/categories/:slug
export async function getCategoryBySlug(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const slug = Array.isArray(req.params["slug"]) ? req.params["slug"][0] : req.params["slug"] ?? "";
    const category = await prisma.category.findFirst({
      where: { slug, isPublished: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        metaTitle: true,
        metaDescription: true,
      },
    });
    if (!category) throw new NotFoundError("Category");

    res.json({ success: true, data: { category } });
  } catch (err) {
    next(err);
  }
}
