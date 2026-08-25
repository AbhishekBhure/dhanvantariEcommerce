/**
 * DHANVANTARI — Database Seed Script
 * Creates demo/placeholder data for development.
 * All seed records are marked with [DEMO] prefix.
 * Remove before production launch with real client data.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ─── Admin User ─────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("Admin@1234", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@dhanvantari.in" },
    update: {},
    create: {
      email: "admin@dhanvantari.in",
      name: "Dhanvantari Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
      isActive: true,
      emailVerified: true,
    },
  });
  console.log("✅ Admin user:", admin.email);

  // ─── Demo Customer ───────────────────────────────────────────
  const customerPassword = await bcrypt.hash("Customer@1234", 12);
  const customer = await prisma.user.upsert({
    where: { email: "demo@customer.com" },
    update: {},
    create: {
      email: "demo@customer.com",
      name: "[DEMO] Test Customer",
      passwordHash: customerPassword,
      phone: "9876543210",
      role: "CUSTOMER",
      isActive: true,
    },
  });
  console.log("✅ Demo customer:", customer.email);

  // ─── Categories ──────────────────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "hair-care" },
      update: {},
      create: {
        name: "[DEMO] Hair Care",
        slug: "hair-care",
        description: "Ayurvedic solutions for healthy, lustrous hair",
        isPublished: true,
        sortOrder: 1,
        metaTitle: "Ayurvedic Hair Care Products | Dhanvantari",
        metaDescription: "Discover natural Ayurvedic hair care products by Dhanvantari Ayurvedic Agencies.",
      },
    }),
    prisma.category.upsert({
      where: { slug: "skin-care" },
      update: {},
      create: {
        name: "[DEMO] Skin Care",
        slug: "skin-care",
        description: "Natural skincare rooted in Ayurvedic wisdom",
        isPublished: true,
        sortOrder: 2,
        metaTitle: "Ayurvedic Skin Care Products | Dhanvantari",
        metaDescription: "Natural Ayurvedic skincare by Dhanvantari Ayurvedic Agencies.",
      },
    }),
    prisma.category.upsert({
      where: { slug: "health-wellness" },
      update: {},
      create: {
        name: "[DEMO] Health & Wellness",
        slug: "health-wellness",
        description: "Supplements and tonics for holistic wellbeing",
        isPublished: true,
        sortOrder: 3,
        metaTitle: "Ayurvedic Health & Wellness Products | Dhanvantari",
        metaDescription: "Ayurvedic health supplements and wellness products by Dhanvantari.",
      },
    }),
    prisma.category.upsert({
      where: { slug: "body-care" },
      update: {},
      create: {
        name: "[DEMO] Body Care",
        slug: "body-care",
        description: "Nourishing body care with traditional formulations",
        isPublished: true,
        sortOrder: 4,
        metaTitle: "Ayurvedic Body Care Products | Dhanvantari",
        metaDescription: "Natural Ayurvedic body care by Dhanvantari Ayurvedic Agencies.",
      },
    }),
  ]);
  console.log("✅ Categories:", categories.map((c) => c.name).join(", "));

  // ─── Products ────────────────────────────────────────────────
  const products = [
    {
      name: "[DEMO] Bhringraj Hair Oil",
      slug: "bhringraj-hair-oil",
      shortDescription: "Nourishing Ayurvedic hair oil with Bhringraj and Amla",
      description: `**[DEMO CONTENT — Replace with approved product description]**\n\nA time-tested Ayurvedic formulation designed to nourish the scalp and strengthen hair roots. This product description is a placeholder and must be replaced with content approved by Dhanvantari Ayurvedic Agencies before launch.`,
      ingredients: "[DEMO] Bhringraj, Amla, Sesame Oil, Coconut Oil — Replace with actual ingredient list approved by the client.",
      usageInstructions: "[DEMO] Apply gently to scalp and hair. Leave for 30 minutes. Wash with mild shampoo. Use 2-3 times per week.",
      mrp: 299,
      price: 249,
      stock: 100,
      isPublished: true,
      isFeatured: true,
      isBestseller: true,
      isNew: false,
      categorySlug: "hair-care",
      metaTitle: "[DEMO] Bhringraj Hair Oil | Dhanvantari",
      metaDescription: "[DEMO] Ayurvedic Bhringraj hair oil by Dhanvantari Ayurvedic Agencies.",
    },
    {
      name: "[DEMO] Kumkumadi Face Serum",
      slug: "kumkumadi-face-serum",
      shortDescription: "Brightening face serum with saffron and natural oils",
      description: `**[DEMO CONTENT — Replace with approved product description]**\n\nA luxurious Ayurvedic serum formulated with precious ingredients. This is placeholder content.`,
      ingredients: "[DEMO] Saffron, Sandalwood, Almond Oil — Replace with actual ingredients.",
      usageInstructions: "[DEMO] Apply 2-3 drops to cleansed face. Gently massage. Use morning and night.",
      mrp: 799,
      price: 649,
      stock: 50,
      isPublished: true,
      isFeatured: true,
      isBestseller: false,
      isNew: true,
      categorySlug: "skin-care",
      metaTitle: "[DEMO] Kumkumadi Face Serum | Dhanvantari",
      metaDescription: "[DEMO] Ayurvedic Kumkumadi brightening serum by Dhanvantari.",
    },
    {
      name: "[DEMO] Ashwagandha Root Powder",
      slug: "ashwagandha-root-powder",
      shortDescription: "Pure Ashwagandha for stress relief and vitality",
      description: `**[DEMO CONTENT — Replace with approved product description]**\n\nPure Ashwagandha powder. This is placeholder content and must not include any therapeutic or medical claims without client approval.`,
      ingredients: "[DEMO] Pure Ashwagandha Root (Withania somnifera) — Replace with actual details.",
      usageInstructions: "[DEMO] Mix 1/2 teaspoon with warm milk or water. Consume once daily. Consult your healthcare provider before use.",
      mrp: 349,
      price: 299,
      stock: 150,
      isPublished: true,
      isFeatured: false,
      isBestseller: true,
      isNew: false,
      categorySlug: "health-wellness",
      metaTitle: "[DEMO] Ashwagandha Root Powder | Dhanvantari",
      metaDescription: "[DEMO] Pure Ashwagandha by Dhanvantari Ayurvedic Agencies.",
    },
    {
      name: "[DEMO] Neem & Tulsi Body Wash",
      slug: "neem-tulsi-body-wash",
      shortDescription: "Purifying body wash with Neem and Tulsi extracts",
      description: `**[DEMO CONTENT — Replace with approved product description]**\n\nA gentle Ayurvedic body wash. This is placeholder content.`,
      ingredients: "[DEMO] Neem Extract, Tulsi Extract — Replace with actual formula.",
      usageInstructions: "[DEMO] Apply to wet body. Lather and rinse thoroughly.",
      mrp: 249,
      price: 199,
      stock: 80,
      isPublished: true,
      isFeatured: false,
      isBestseller: false,
      isNew: true,
      categorySlug: "body-care",
      metaTitle: "[DEMO] Neem Tulsi Body Wash | Dhanvantari",
      metaDescription: "[DEMO] Natural Neem & Tulsi body wash by Dhanvantari.",
    },
    {
      name: "[DEMO] Triphala Churna",
      slug: "triphala-churna",
      shortDescription: "Classic Ayurvedic digestive blend of three fruits",
      description: `**[DEMO CONTENT — Replace with approved product description]**\n\nA traditional Ayurvedic formulation. Placeholder content — do not use medical claims without approval.`,
      ingredients: "[DEMO] Amalaki, Bibhitaki, Haritaki — Replace with approved details.",
      usageInstructions: "[DEMO] Mix 1 teaspoon with warm water before bed. Consult healthcare provider.",
      mrp: 199,
      price: 169,
      stock: 200,
      isPublished: true,
      isFeatured: false,
      isBestseller: true,
      isNew: false,
      categorySlug: "health-wellness",
      metaTitle: "[DEMO] Triphala Churna | Dhanvantari",
      metaDescription: "[DEMO] Authentic Triphala by Dhanvantari Ayurvedic Agencies.",
    },
    {
      name: "[DEMO] Chandan Face Pack",
      slug: "chandan-face-pack",
      shortDescription: "Sandalwood face pack for glowing, radiant skin",
      description: `**[DEMO CONTENT — Replace with approved product description]**\n\nA sandalwood-based face pack. Placeholder content.`,
      ingredients: "[DEMO] Sandalwood Powder, Turmeric, Rose Water — Replace with approved list.",
      usageInstructions: "[DEMO] Mix with rose water to form paste. Apply to face. Leave 15-20 minutes. Rinse.",
      mrp: 299,
      price: 249,
      stock: 60,
      isPublished: true,
      isFeatured: true,
      isBestseller: false,
      isNew: false,
      categorySlug: "skin-care",
      metaTitle: "[DEMO] Chandan Face Pack | Dhanvantari",
      metaDescription: "[DEMO] Ayurvedic Sandalwood face pack by Dhanvantari.",
    },
  ];

  for (const productData of products) {
    const { categorySlug, ...data } = productData;
    const category = categories.find((c) => c.slug === categorySlug);

    const existingProduct = await prisma.product.findUnique({
      where: { slug: data.slug },
    });

    if (!existingProduct) {
      const product = await prisma.product.create({
        data: {
          ...data,
          categories: category
            ? { create: [{ categoryId: category.id }] }
            : undefined,
        },
      });
      console.log("✅ Product:", product.name);
    } else {
      console.log("⏭️  Product already exists:", data.name);
    }
  }

  // ─── Demo Banner ─────────────────────────────────────────────
  await prisma.banner.upsert({
    where: { id: "demo-banner-1" },
    update: {},
    create: {
      id: "demo-banner-1",
      title: "[DEMO] Pure Ayurveda. Modern Living.",
      subtitle: "[DEMO] Discover time-tested formulations crafted for today",
      imageUrl: "https://placehold.co/1440x600/2d6a4f/ffffff?text=Dhanvantari+Banner",
      mobileImageUrl: "https://placehold.co/768x500/2d6a4f/ffffff?text=Dhanvantari+Banner",
      linkUrl: "/shop",
      linkText: "Shop Now",
      isActive: true,
      sortOrder: 0,
    },
  });
  console.log("✅ Demo banner created");

  // ─── Demo Coupon ─────────────────────────────────────────────
  const existingCoupon = await prisma.coupon.findUnique({ where: { code: "WELCOME10" } });
  if (!existingCoupon) {
    await prisma.coupon.create({
      data: {
        code: "WELCOME10",
        type: "PERCENTAGE",
        value: 10,
        minimumOrder: 299,
        maximumDiscount: 100,
        description: "[DEMO] 10% off on your first order",
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        usageLimit: 1000,
        perUserLimit: 1,
      },
    });
    console.log("✅ Demo coupon: WELCOME10");
  }

  // ─── Demo address for test customer ─────────────────────────
  const existingAddress = await prisma.address.findFirst({
    where: { userId: customer.id },
  });
  if (!existingAddress) {
    await prisma.address.create({
      data: {
        userId: customer.id,
        name: "[DEMO] Test Customer",
        phone: "9876543210",
        line1: "[DEMO] 123, Ayurveda Lane",
        line2: "Near Demo Park",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        country: "India",
        isDefault: true,
      },
    });
    console.log("✅ Demo address created");
  }

  console.log("\n✅ Database seeded successfully!");
  console.log("\n📋 Demo Credentials:");
  console.log("   Admin:    admin@dhanvantari.in / Admin@1234");
  console.log("   Customer: demo@customer.com / Customer@1234");
  console.log("   Coupon:   WELCOME10 (10% off, min ₹299)");
  console.log("\n⚠️  All [DEMO] data must be replaced with real client data before launch.");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
