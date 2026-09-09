import { Router } from "express";
import prisma from "../../lib/prisma.js";
import { validate } from "../../middleware/validate.js";
import { NotFoundError } from "../../middleware/errorHandler.js";
import { bannerSchema } from "@dhanvantari/validation";

const router: ReturnType<typeof Router> = Router();

router.get("/", async (_req, res, next) => {
  try {
    const banners = await prisma.banner.findMany({ orderBy: { sortOrder: "asc" } });
    res.json({ success: true, data: { banners } });
  } catch (err) {
    next(err);
  }
});

router.post("/", validate(bannerSchema), async (req, res, next) => {
  try {
    const banner = await prisma.banner.create({ data: req.body });
    res.status(201).json({ success: true, data: { banner } });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", validate(bannerSchema.partial()), async (req, res, next) => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Banner");
    const banner = await prisma.banner.update({ where: { id }, data: req.body });
    res.json({ success: true, data: { banner } });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = Array.isArray(req.params["id"]) ? req.params["id"][0] : req.params["id"] ?? "";
    const existing = await prisma.banner.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError("Banner");
    await prisma.banner.delete({ where: { id } });
    res.json({ success: true, message: "Banner deleted" });
  } catch (err) {
    next(err);
  }
});

export default router;
