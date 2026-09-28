import { Router } from "express";
import prisma from "../lib/prisma.js";
import { NotFoundError } from "../middleware/errorHandler.js";

const router: ReturnType<typeof Router> = Router();

// GET /api/posts — list published blog posts
router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query["page"] ?? 1));
    const pageSize = Math.min(50, Math.max(1, Number(req.query["pageSize"] ?? 12)));
    const category = typeof req.query["category"] === "string" ? req.query["category"] : undefined;
    const search = typeof req.query["search"] === "string" ? req.query["search"] : undefined;

    const where: Record<string, unknown> = {
      isPublished: true,
    };

    if (category) {
      where["category"] = { equals: category, mode: "insensitive" };
    }

    if (search) {
      where["OR"] = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        { tags: { contains: search, mode: "insensitive" } },
      ];
    }

    const [posts, total, categoriesRaw] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          excerpt: true,
          coverImage: true,
          category: true,
          tags: true,
          authorName: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where: { isPublished: true, category: { not: null } },
        select: { category: true },
        distinct: ["category"],
      }),
    ]);

    const categories = categoriesRaw
      .map((c) => c.category)
      .filter((c): c is string => Boolean(c));

    res.json({
      success: true,
      data: {
        posts,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        categories,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/posts/:slug — get single published blog post by slug
router.get("/:slug", async (req, res, next) => {
  try {
    const slug = Array.isArray(req.params["slug"])
      ? req.params["slug"][0]
      : req.params["slug"] ?? "";

    const post = await prisma.blogPost.findFirst({
      where: {
        slug,
        isPublished: true,
      },
    });

    if (!post) {
      throw new NotFoundError("Blog post");
    }

    // Fetch up to 3 related posts in the same category
    const relatedPosts = await prisma.blogPost.findMany({
      where: {
        isPublished: true,
        id: { not: post.id },
        ...(post.category ? { category: post.category } : {}),
      },
      take: 3,
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        coverImage: true,
        category: true,
        publishedAt: true,
      },
    });

    res.json({ success: true, data: { post, relatedPosts } });
  } catch (err) {
    next(err);
  }
});

export default router;
