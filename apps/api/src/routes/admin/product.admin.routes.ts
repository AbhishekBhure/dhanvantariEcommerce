import { Router } from "express";
import slugify from "slugify";
import prisma from "../../lib/prisma.js";
import { validate } from "../../middleware/validate.js";
import { NotFoundError } from "../../middleware/errorHandler.js";
import { productSchema, paginationSchema } from "@dhanvantari/validation";

const router = Router();

// GET /api/admin/products
router.get("/", validate(paginationSchema, "query"), async (req, res, next) => {
  try {
    const { page, pageSize, search } = req.query as {
      page: number;
      pageSize: number;
      search?: string;
    };

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { sku: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          mrp: true,
          price: true,
          stock: true,
          isPublished: true,
          isFeatured: true,
          isBestseller: true,
          createdAt: true,
          images: { where: { sortOrder: 0 }, take: 1 },
          categories: {
            select: { category: { select: { name: true } } },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        products: products.map((p) => ({
          ...p,
          mrp: Number(p.mrp),
          price: Number(p.price),
          primaryImage: p.images[0]?.url ?? null,
          categories: p.categories.map((c) => c.category.name),
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/products/:id
router.get("/:id", async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params["id"] },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
        categories: { include: { category: true } },
      },
    });
    if (!product) throw new NotFoundError("Product");
    res.json({ success: true, data: { product } });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/products
router.post("/", validate(productSchema), async (req, res, next) => {
  try {
    const data = req.body as {
      name: string;
      slug?: string;
      description?: string | null;
      shortDescription?: string | null;
      ingredients?: string | null;
      usageInstructions?: string | null;
      sku?: string | null;
      mrp: number;
      price: number;
      stock: number;
      isPublished: boolean;
      isFeatured: boolean;
      isBestseller: boolean;
      isNew: boolean;
      categoryIds: string[];
      variants: Array<{
        name: string;
        sku?: string | null;
        mrp: number;
        price: number;
        stock: number;
        weight?: number | null;
        isAvailable: boolean;
      }>;
      metaTitle?: string | null;
      metaDescription?: string | null;
    };

    const slug =
      data.slug ??
      slugify(data.name, { lower: true, strict: true });

    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        shortDescription: data.shortDescription,
        ingredients: data.ingredients,
        usageInstructions: data.usageInstructions,
        sku: data.sku,
        mrp: data.mrp,
        price: data.price,
        stock: data.stock,
        isPublished: data.isPublished,
        isFeatured: data.isFeatured,
        isBestseller: data.isBestseller,
        isNew: data.isNew,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        categories: {
          create: data.categoryIds.map((categoryId) => ({ categoryId })),
        },
        variants: {
          create: data.variants.map((v) => ({
            name: v.name,
            sku: v.sku,
            mrp: v.mrp,
            price: v.price,
            stock: v.stock,
            weight: v.weight,
            isAvailable: v.isAvailable,
          })),
        },
      },
    });

    res.status(201).json({ success: true, data: { product } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/products/:id
router.patch("/:id", validate(productSchema.partial()), async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body as Partial<{
      name: string;
      isPublished: boolean;
      isFeatured: boolean;
      isBestseller: boolean;
      isNew: boolean;
      price: number;
      mrp: number;
      stock: number;
      categoryIds: string[];
    }>;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Product");

    const { categoryIds, ...rest } = data;

    const product = await prisma.$transaction(async (tx) => {
      if (categoryIds) {
        await tx.productCategory.deleteMany({ where: { productId: id } });
        await tx.productCategory.createMany({
          data: categoryIds.map((categoryId) => ({ productId: id, categoryId })),
        });
      }
      return tx.product.update({
        where: { id },
        data: rest,
      });
    });

    res.json({ success: true, data: { product } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/products/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Product");

    // Soft delete by unpublishing instead of hard delete
    await prisma.product.update({
      where: { id },
      data: { isPublished: false },
    });
    res.json({ success: true, message: "Product unpublished" });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/products/:id/inventory-adjust
router.post("/:id/inventory-adjust", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantity, reason } = req.body as { quantity: number; reason: string };

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError("Product");

    await prisma.$transaction([
      prisma.product.update({
        where: { id },
        data: { stock: { increment: quantity } },
      }),
      prisma.inventoryLog.create({
        data: {
          productId: id,
          delta: quantity,
          reason: `MANUAL: ${reason}`,
          adjustedBy: req.user?.userId,
        },
      }),
    ]);

    res.json({ success: true, message: "Inventory adjusted" });
  } catch (err) {
    next(err);
  }
});

export default router;
