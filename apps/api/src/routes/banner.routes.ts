import { Router } from "express";
import prisma from "../lib/prisma.js";

const router: ReturnType<typeof Router> = Router();

// GET /api/banners
router.get("/", async (_req, res, next) => {
  try {
    const banners = await prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    res.json({ success: true, data: { banners } });
  } catch (err) {
    next(err);
  }
});

export default router;
