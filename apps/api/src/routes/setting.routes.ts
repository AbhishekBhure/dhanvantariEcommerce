import { Router } from "express";
import prisma from "../lib/prisma.js";

const router: ReturnType<typeof Router> = Router();

// Default values for storefront settings so the frontend always has good fallbacks
const DEFAULT_SETTINGS: Record<string, unknown> = {
  announcement: {
    isEnabled: true,
    text: "🌿 100% Authentic Ayurvedic Formulations — Flat ₹50 Delivery Charge on All Orders",
    linkUrl: "/shop",
    badgeText: "PURE AYURVEDA",
  },
  info: {
    brandName: "Dhanvantari Ayurvedic Agencies",
    tagline: "Pure Ayurveda, Modern Living",
    phone: "+91 98765 43210",
    email: "care@dhanvantari.in",
    address: "Dhanvantari Ayurvedic Agencies, Main Market, Ayurvedic Bhawan, India",
    hours: "Mon – Sat: 9:00 AM – 7:00 PM IST",
    whatsappNumber: "919876543210",
    instagramUrl: "https://instagram.com",
    facebookUrl: "https://facebook.com",
    youtubeUrl: "https://youtube.com",
  },
  homeSections: {
    trustBadges: [
      {
        icon: "Leaf",
        title: "100% Natural",
        description: "Formulated with authentic Ayurvedic herbs, free from harmful chemicals.",
      },
      {
        icon: "Shield",
        title: "Quality Assured",
        description: "Every product is tested and manufactured under strict quality standards.",
      },
      {
        icon: "Award",
        title: "Traditional Wisdom",
        description: "Centuries of Ayurvedic knowledge backed by modern manufacturing.",
      },
      {
        icon: "Truck",
        title: "Fast Delivery",
        description: "Flat ₹50 delivery charge applies to every order, delivered pan-India.",
      },
    ],
    storyHeading: "Rooted in Tradition,",
    storyHighlight: "Built for Today",
    storyDescription:
      "At Dhanvantari Ayurvedic Agencies, we combine centuries of Ayurvedic wisdom with modern quality standards to bring you authentic wellness products that truly work.",
    storyCtaText: "Learn Our Story",
    storyCtaLink: "/about",
  },
};

// GET /api/settings — get all storefront settings
router.get("/", async (_req, res, next) => {
  try {
    const settingsRecords = await prisma.siteSetting.findMany();
    const settingsMap: Record<string, unknown> = { ...DEFAULT_SETTINGS };

    for (const record of settingsRecords) {
      settingsMap[record.key] = record.value;
    }

    res.json({
      success: true,
      data: { settings: settingsMap },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/settings/:key — get single setting
router.get("/:key", async (req, res, next) => {
  try {
    const key = Array.isArray(req.params["key"])
      ? req.params["key"][0]
      : req.params["key"] ?? "";

    const record = await prisma.siteSetting.findUnique({
      where: { key },
    });

    const value = record ? record.value : DEFAULT_SETTINGS[key] ?? null;

    res.json({
      success: true,
      data: { key, value },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
