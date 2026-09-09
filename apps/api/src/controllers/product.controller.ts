import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../lib/prisma.js";
import { NotFoundError } from "../middleware/errorHandler.js";
import { ProductFilterInput } from "@dhanvantari/validation";

// GET /api/products
export async function getProducts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      categorySlug,
      search,
      minPrice,
      maxPrice,
      inStock,
      isFeatured,
      isBestseller,
      isNew,
      sortBy = "newest",
      page = 1,
      pageSize = 12,
    } = req.query as unknown as ProductFilterInput;

    const where: Prisma.ProductWhereInput = {
      isPublished: true,
    };

    if (categorySlug) {
      where.categories = {
        some: { category: { slug: categorySlug, isPublished: true } },
      };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
      ];
    }
    if (minPrice !== undefined) where.price = { gte: minPrice };
    if (maxPrice !== undefined) {
      where.price = { ...(where.price as object ?? {}), lte: maxPrice };
    }
    if (inStock) where.stock = { gt: 0 };
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (isBestseller !== undefined) where.isBestseller = isBestseller;
    if (isNew !== undefined) where.isNew = isNew;

    const orderBy: Prisma.ProductOrderByWithRelationInput = (() => {
      switch (sortBy) {
        case "price_asc": return { price: "asc" as const };
        case "price_desc": return { price: "desc" as const };
        case "name_asc": return { name: "asc" as const };
        default: return { createdAt: "desc" as const };
      }
    })();

    const skip = (page - 1) * pageSize;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        select: {
          id: true,
          name: true,
          slug: true,
          shortDescription: true,
          mrp: true,
          price: true,
          stock: true,
          isFeatured: true,
          isBestseller: true,
          isNew: true,
          images: {
            where: { sortOrder: 0 },
            select: { url: true, altText: true },
            take: 1,
          },
          categories: {
            select: {
              category: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    res.json({
      success: true,
      data: {
        products: products.map((p) => ({
          ...p,
          primaryImage: p.images[0]?.url ?? null,
          categories: p.categories.map((pc) => pc.category),
          mrp: Number(p.mrp),
          price: Number(p.price),
        })),
        total,
        page,
        pageSize,
        totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/products/:slug
export async function getProductBySlug(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const slug = Array.isArray(req.params["slug"]) ? req.params["slug"][0] : (req.params["slug"] ?? "") as string;

    const product = await prisma.product.findFirst({
      where: { slug, isPublished: true },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { where: { isAvailable: true }, orderBy: { createdAt: "asc" } },
        categories: {
          include: { category: { select: { id: true, name: true, slug: true } } },
        },
        reviews: {
          where: { isApproved: true },
          include: {
            user: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: { select: { reviews: { where: { isApproved: true } } } },
      },
    });

    if (!product) throw new NotFoundError("Product");

    res.json({
      success: true,
      data: {
        product: {
          ...product,
          mrp: Number(product.mrp),
          price: Number(product.price),
          variants: product.variants.map((v) => ({
            ...v,
            mrp: Number(v.mrp),
            price: Number(v.price),
          })),
          categories: product.categories.map((pc) => pc.category),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/products/featured
export async function getFeaturedProducts(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const products = await prisma.product.findMany({
      where: { isPublished: true, isFeatured: true },
      take: 8,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        mrp: true,
        price: true,
        stock: true,
        images: { where: { sortOrder: 0 }, take: 1 },
        categories: {
          select: { category: { select: { id: true, name: true, slug: true } } },
        },
      },
    });

    res.json({
      success: true,
      data: {
        products: products.map((p) => ({
          ...p,
          primaryImage: p.images[0]?.url ?? null,
          mrp: Number(p.mrp),
          price: Number(p.price),
          categories: p.categories.map((pc) => pc.category),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}
