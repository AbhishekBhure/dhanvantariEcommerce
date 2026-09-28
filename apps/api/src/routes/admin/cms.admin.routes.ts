import { Router } from "express";
import slugify from "slugify";
import prisma from "../../lib/prisma.js";
import { validate } from "../../middleware/validate.js";
import { NotFoundError } from "../../middleware/errorHandler.js";
import { contentPageSchema, blogPostSchema } from "@dhanvantari/validation";

const router: ReturnType<typeof Router> = Router();

// Helper to make unique slugs
async function ensureUniquePageSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await prisma.contentPage.findUnique({ where: { slug } });
    if (!existing || (excludeId && existing.id === excludeId)) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

async function ensureUniquePostSlug(baseSlug: string, excludeId?: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  while (true) {
    const existing = await prisma.blogPost.findUnique({ where: { slug } });
    if (!existing || (excludeId && existing.id === excludeId)) {
      return slug;
    }
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// ═══════════════════════════════════════════════════════════════
// CMS PAGES
// ═══════════════════════════════════════════════════════════════

// GET /api/admin/cms/pages
router.get("/pages", async (req, res, next) => {
  try {
    const search = typeof req.query["search"] === "string" ? req.query["search"] : undefined;
    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const pages = await prisma.contentPage.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    res.json({ success: true, data: { pages } });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/cms/pages/:id
router.get("/pages/:id", async (req, res, next) => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const page = await prisma.contentPage.findUnique({ where: { id } });
    if (!page) throw new NotFoundError("Page");
    res.json({ success: true, data: { page } });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/cms/pages
router.post("/pages", validate(contentPageSchema), async (req, res, next) => {
  try {
    const data = req.body as {
      title: string;
      slug?: string;
      excerpt?: string | null;
      content: string;
      featuredImage?: string | null;
      isPublished: boolean;
      metaTitle?: string | null;
      metaDescription?: string | null;
    };

    const rawSlug = data.slug?.trim() || slugify(data.title, { lower: true, strict: true });
    const slug = await ensureUniquePageSlug(rawSlug);

    const page = await prisma.contentPage.create({
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt,
        content: data.content,
        featuredImage: data.featuredImage || null,
        isPublished: Boolean(data.isPublished),
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
      },
    });

    res.status(201).json({ success: true, data: { page } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/cms/pages/:id
router.patch("/pages/:id", validate(contentPageSchema.partial()), async (req, res, next) => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const existing = await prisma.contentPage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Page");

    const updateData: Record<string, unknown> = { ...req.body };

    if (typeof req.body["slug"] === "string" && req.body["slug"].trim() !== existing.slug) {
      updateData["slug"] = await ensureUniquePageSlug(
        slugify(req.body["slug"], { lower: true, strict: true }),
        id
      );
    }

    const page = await prisma.contentPage.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, data: { page } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/cms/pages/:id
router.delete("/pages/:id", async (req, res, next) => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const existing = await prisma.contentPage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Page");

    await prisma.contentPage.delete({ where: { id } });
    res.json({ success: true, message: "Page deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════
// CMS BLOG POSTS
// ═══════════════════════════════════════════════════════════════

// GET /api/admin/cms/posts
router.get("/posts", async (req, res, next) => {
  try {
    const search = typeof req.query["search"] === "string" ? req.query["search"] : undefined;
    const category = typeof req.query["category"] === "string" ? req.query["category"] : undefined;
    const status = typeof req.query["status"] === "string" ? req.query["status"] : undefined;

    const where: Record<string, unknown> = {};
    if (search) {
      where["OR"] = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { authorName: { contains: search, mode: "insensitive" } },
      ];
    }
    if (category) {
      where["category"] = category;
    }
    if (status === "published") {
      where["isPublished"] = true;
    } else if (status === "draft") {
      where["isPublished"] = false;
    }

    const posts = await prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: { posts } });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/cms/posts/:id
router.get("/posts/:id", async (req, res, next) => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundError("Blog post");
    res.json({ success: true, data: { post } });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/cms/posts
router.post("/posts", validate(blogPostSchema), async (req, res, next) => {
  try {
    const data = req.body as {
      title: string;
      slug?: string;
      excerpt?: string | null;
      content: string;
      coverImage?: string | null;
      category?: string | null;
      tags?: string | null;
      authorName?: string;
      isPublished: boolean;
      metaTitle?: string | null;
      metaDescription?: string | null;
    };

    const rawSlug = data.slug?.trim() || slugify(data.title, { lower: true, strict: true });
    const slug = await ensureUniquePostSlug(rawSlug);

    const post = await prisma.blogPost.create({
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt,
        content: data.content,
        coverImage: data.coverImage || null,
        category: data.category,
        tags: data.tags,
        authorName: data.authorName || "Dhanvantari Vaidya",
        isPublished: Boolean(data.isPublished),
        publishedAt: data.isPublished ? new Date() : null,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
      },
    });

    res.status(201).json({ success: true, data: { post } });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/cms/posts/:id
router.patch("/posts/:id", validate(blogPostSchema.partial()), async (req, res, next) => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Blog post");

    const updateData: Record<string, unknown> = { ...req.body };

    if (typeof req.body["slug"] === "string" && req.body["slug"].trim() !== existing.slug) {
      updateData["slug"] = await ensureUniquePostSlug(
        slugify(req.body["slug"], { lower: true, strict: true }),
        id
      );
    }

    if (req.body["isPublished"] === true && !existing.isPublished && !existing.publishedAt) {
      updateData["publishedAt"] = new Date();
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data: updateData,
    });

    res.json({ success: true, data: { post } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/cms/posts/:id
router.delete("/posts/:id", async (req, res, next) => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Blog post");

    await prisma.blogPost.delete({ where: { id } });
    res.json({ success: true, message: "Blog post deleted successfully" });
  } catch (err) {
    next(err);
  }
});

// ═══════════════════════════════════════════════════════════════
// CMS STOREFRONT CUSTOMIZER / SITE SETTINGS
// ═══════════════════════════════════════════════════════════════

// GET /api/admin/cms/settings
router.get("/settings", async (_req, res, next) => {
  try {
    const settings = await prisma.siteSetting.findMany();
    const settingsMap: Record<string, unknown> = {};
    for (const record of settings) {
      settingsMap[record.key] = record.value;
    }
    res.json({ success: true, data: { settings: settingsMap } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/cms/settings/:key
router.put("/settings/:key", async (req, res, next) => {
  try {
    const key = Array.isArray(req.params["key"])
      ? req.params["key"][0]
      : req.params["key"] ?? "";
    const value = req.body["value"] !== undefined ? req.body["value"] : req.body;

    const setting = await prisma.siteSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });

    res.json({ success: true, data: { setting } });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/cms/settings/bulk
router.post("/settings/bulk", async (req, res, next) => {
  try {
    const entries = Object.entries(req.body as Record<string, unknown>);
    const results = [];

    for (const [key, value] of entries) {
      const setting = await prisma.siteSetting.upsert({
        where: { key },
        create: { key, value: value as object },
        update: { value: value as object },
      });
      results.push(setting);
    }

    res.json({ success: true, data: { updated: results.length } });
  } catch (err) {
    next(err);
  }
});

export default router;
