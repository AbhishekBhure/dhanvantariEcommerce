import { Router } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import slugify from "slugify";
import prisma from "../../lib/prisma.js";
import { validate } from "../../middleware/validate.js";
import { AppError, BadRequestError, NotFoundError } from "../../middleware/errorHandler.js";
import logger from "../../lib/logger.js";
import { productSchema, paginationSchema, type ProductInput } from "@dhanvantari/validation";

const router: ReturnType<typeof Router> = Router();
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
    if (!allowed.has(file.mimetype)) return callback(new Error("Upload a JPG, PNG, WebP, or AVIF image."));
    callback(null, true);
  },
});

// GET /api/admin/products
router.get("/", validate(paginationSchema, "query"), async (req, res, next) => {
  try {
    const page = Number(req.query["page"] ?? 1);
    const pageSize = Number(req.query["pageSize"] ?? 20);
    const search = typeof req.query["search"] === "string" ? req.query["search"] : undefined;

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
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const product = await prisma.product.findUnique({
      where: { id },
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

router.post("/:id/images/upload", imageUpload.single("image"), async (req, res, next) => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const file = req.file;
    if (!file) throw new BadRequestError("Choose a supported image file to upload.");
    const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!product) throw new NotFoundError("Product");

    const supabaseUrl = process.env["SUPABASE_URL"]?.replace(/\/$/, "");
    const serviceKey = process.env["SUPABASE_SERVICE_KEY"];
    const bucket = process.env["SUPABASE_PRODUCT_IMAGES_BUCKET"] ?? "product-images";
    if (!supabaseUrl || !serviceKey) throw new AppError("Supabase Storage is not configured on the API.", 503);

    const extensionByType: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
    const storagePath = `${id}/${randomUUID()}.${extensionByType[file.mimetype]}`;
    const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${storagePath.split("/").map(encodeURIComponent).join("/")}`, {
      method: "POST",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": file.mimetype, "x-upsert": "false" },
      body: file.buffer,
      signal: AbortSignal.timeout(20000),
    });
    if (!uploadResponse.ok) {
      const responseBody = await uploadResponse.text();
      logger.error({ status: uploadResponse.status, responseBody, bucket }, "Supabase image upload failed");
      throw new AppError("Image upload failed. Check the product-images bucket and API storage configuration.", 502);
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${storagePath.split("/").map(encodeURIComponent).join("/")}`;
    res.status(201).json({ success: true, data: { url: publicUrl, altText: file.originalname } });
  } catch (error) { next(error); }
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
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const data = req.body as Partial<ProductInput>;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Product");

    const { categoryIds, variants: _variants, ...rest } = data;

    const product = await prisma.$transaction(async (tx) => {
      if (categoryIds) {
        const normalizedId = id as string;
        await tx.productCategory.deleteMany({ where: { productId: normalizedId } });
        await tx.productCategory.createMany({
          data: categoryIds.map((categoryId) => ({ productId: normalizedId, categoryId })),
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

router.put("/:id/images", async (req, res, next) => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const images = req.body.images as Array<{ url: string; altText?: string | null }>;
    if (!Array.isArray(images) || images.length > 20) throw new BadRequestError("Provide no more than 20 images.");
    for (const image of images) {
      let parsedUrl: URL;
      try { parsedUrl = new URL(image.url); } catch { throw new BadRequestError("Enter a valid image URL."); }
      if (parsedUrl.protocol !== "https:") throw new BadRequestError("Product image URLs must use HTTPS.");
    }
    const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!product) throw new NotFoundError("Product");
    const saved = await prisma.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: id } });
      if (images.length) await tx.productImage.createMany({ data: images.map((image, sortOrder) => ({ productId: id, url: image.url, altText: image.altText ?? null, sortOrder })) });
      return tx.productImage.findMany({ where: { productId: id }, orderBy: { sortOrder: "asc" } });
    });
    res.json({ success: true, data: { images: saved } });
  } catch (err) { next(err); }
});

// DELETE /api/admin/products/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
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
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const { quantity, reason } = req.body as { quantity: number; reason: string };
    if (!Number.isInteger(quantity) || quantity === 0 || typeof reason !== "string" || reason.trim().length < 3) {
      throw new BadRequestError("Provide a non-zero whole-number adjustment and a reason.");
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError("Product");
    if (product.stock + quantity < 0) throw new BadRequestError("Inventory cannot be reduced below zero.");

    const adminUserId = (req as unknown as { user?: { userId?: string } }).user?.userId ?? null;

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
          adjustedBy: adminUserId,
        },
      }),
    ]);

    res.json({ success: true, message: "Inventory adjusted" });
  } catch (err) {
    next(err);
  }
});

export default router;
