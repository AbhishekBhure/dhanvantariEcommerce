import { Router } from "express";
import prisma from "../lib/prisma.js";
import { NotFoundError } from "../middleware/errorHandler.js";

const router: ReturnType<typeof Router> = Router();

// GET /api/pages — list published pages for navigation/footer
router.get("/", async (_req, res, next) => {
  try {
    const pages = await prisma.contentPage.findMany({
      where: { isPublished: true },
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        updatedAt: true,
      },
      orderBy: { title: "asc" },
    });

    res.json({ success: true, data: { pages } });
  } catch (err) {
    next(err);
  }
});

// GET /api/pages/:slug — get single published page by slug
router.get("/:slug", async (req, res, next) => {
  try {
    const slug = Array.isArray(req.params["slug"])
      ? req.params["slug"][0]
      : req.params["slug"] ?? "";

    const page = await prisma.contentPage.findFirst({
      where: {
        slug,
        isPublished: true,
      },
    });

    if (!page) {
      throw new NotFoundError("Page");
    }

    res.json({ success: true, data: { page } });
  } catch (err) {
    next(err);
  }
});

export default router;
