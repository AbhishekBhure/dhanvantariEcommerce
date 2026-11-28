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

  // ─── CMS Pages (with [slug]) ─────────────────────────────────
  const demoPages = [
    {
      slug: "about",
      title: "About Dhanvantari Ayurvedic Agencies",
      excerpt: "Rooted in authentic Vedic tradition, Dhanvantari brings time-tested Ayurvedic formulations to modern everyday wellness.",
      content: `## Pure Ayurveda for the Modern Era

At **Dhanvantari Ayurvedic Agencies**, our journey began with a profound reverence for India's 5,000-year-old healing science: Ayurveda. Named after the celestial physician Lord Dhanvantari, our mission is to preserve the uncompromising purity of classical Ayurvedic scriptures while applying modern GMP manufacturing precision.

### The Three Pillars of Our Craft

1. **Botanical Authenticity**: We source wildcrafted herbs, unrefined cold-pressed oils, and certified organic extracts from their native micro-climates across India.
2. **Classical Formulations**: Prepared in small, artisanal batches according to authentic recipes (*Charaka Samhita* and *Sushruta Samhita*).
3. **Purity & Non-Toxicity**: Zero artificial fragrances, parabens, sulfates, silicones, or heavy mineral adulterations.

### From Our Vaidyas to Your Home
Every formulation is balanced with the three Doshas (Vata, Pitta, and Kapha) in mind, restoring the body's natural harmony.`,
      isPublished: true,
      metaTitle: "About Dhanvantari | Pure Ayurvedic Formulations & Heritage",
      metaDescription: "Learn about Dhanvantari Ayurvedic Agencies, our authentic herbal formulations, and classical Ayurvedic heritage.",
    },
    {
      slug: "ayurvedic-heritage",
      title: "Our Heritage: The Dhanvantari Tradition",
      excerpt: "Explore the lineage, classical pharmacy methods, and the sacred botanicals that make our agency unique.",
      content: `## The Sacred Tradition of Dhanvantari

For generations, Dhanvantari has stood as a guardian of classical Ayurvedic preparation methods:

* **Taila Paka Vidhi**: Traditional oil-infusion process taking days of slow decoction to transfer herbal phytonutrients into virgin sesame and coconut bases.
* **Kashayam Brews**: Slow boiling of coarse herbal roots, bark, and seeds to create therapeutic extracts without artificial solvent residues.
* **Sun-Drying & Gentle Milling**: Preserving volatile aromatics and active enzymes in botanical leaves and herbs.

Experience the authentic difference that care, time, and Vedic wisdom make in every drop and remedy.`,
      isPublished: true,
      metaTitle: "Our Ayurvedic Heritage | Dhanvantari Ayurvedic Agencies",
      metaDescription: "Discover how traditional Ayurvedic oil-cooking and slow extraction methods define Dhanvantari wellness products.",
    },
    {
      slug: "faq",
      title: "Frequently Asked Questions",
      excerpt: "Common questions regarding our Ayurvedic products, usage routines, safety, shipping, and storage.",
      content: `## Frequently Asked Questions

### 1. Are Dhanvantari products 100% natural?
Yes. All our products are crafted from wildcrafted herbs, cold-pressed oils, and authentic botanical extracts without synthetic parabens, artificial fragrances, or harmful sulfates.

### 2. How do I choose the right product for my dosha?
If you suffer from dryness or brittle hair, our Vata-balancing oils are ideal. For cooling and soothing sensitive scalps or inflamed skin, choose Pitta-balancing formulations. For oiliness and congestion, our Kapha-balancing remedies deliver optimal clarity.

### 3. How long does standard shipping take?
Orders are dispatched within 24-48 hours. Pan-India delivery typically takes 3 to 5 business days. You will receive an AWB tracking code upon dispatch.

### 4. What is your return policy?
We offer hassle-free returns or replacements within 7 days of delivery for damaged or incorrect shipments. Please reach out to care@dhanvantari.in with your order number.`,
      isPublished: true,
      metaTitle: "Frequently Asked Questions | Dhanvantari Ayurvedic Helpdesk",
      metaDescription: "Get answers to common queries regarding product authenticity, dosha suitability, shipping times, and orders.",
    },
    {
      slug: "privacy-policy",
      title: "Privacy Policy",
      excerpt: "How Dhanvantari Ayurvedic Agencies collects, protects, and respects your personal information.",
      content: `## Privacy Policy

**Effective Date:** January 1, 2025

Dhanvantari Ayurvedic Agencies ("we," "our," or "us") respects your privacy and is dedicated to securing any personal data you entrust to us when visiting our online storefront.

### Information We Collect
* Contact and identity details: name, phone number, shipping and billing address, email.
* Order transaction history and payment status (note: we do not store sensitive credit/debit card credentials; transactions are processed via PCI-DSS certified gateways).
* Browsing data and cookies to maintain cart sessions and provide personalized recommendations.

### Contact Us
For any inquiries regarding your privacy or data rights, email our Data Privacy Officer at **privacy@dhanvantari.in**.`,
      isPublished: true,
      metaTitle: "Privacy Policy | Dhanvantari Ayurvedic Agencies",
      metaDescription: "Privacy policy and data protection disclosures for Dhanvantari Ayurvedic Agencies.",
    },
    {
      slug: "terms-conditions",
      title: "Terms and Conditions",
      excerpt: "Terms of use, purchase conditions, and legal guidelines governing our website and orders.",
      content: `## Terms & Conditions of Service

Welcome to Dhanvantari Ayurvedic Agencies. By accessing or shopping on our website, you agree to comply with and be bound by the following terms:

1. **Product Availability**: Product listings, prices, and inventory are subject to change without prior notice.
2. **Ayurvedic Disclaimers**: Ayurvedic products are designed to support holistic health and well-being. They are not intended as substitutes for emergency medical diagnoses or surgical interventions.
3. **Intellectual Property**: All brand logos, packaging visuals, product descriptions, and articles are intellectual property of Dhanvantari Ayurvedic Agencies.`,
      isPublished: true,
      metaTitle: "Terms and Conditions | Dhanvantari Ayurvedic Agencies",
      metaDescription: "Terms and conditions governing orders, website access, and customer relations.",
    },
    {
      slug: "shipping-policy",
      title: "Shipping & Delivery Policy",
      excerpt: "Delivery timelines, charges, cash-on-delivery guidelines, and transit tracking details.",
      content: `## Shipping & Delivery Policy

### Delivery Coverage
We deliver across all serviceable pincodes in India via trusted tier-1 logistics partners (Delhivery, BlueDart, and India Post).

### Shipping Charges
* **All orders**: Flat ₹50 pan-India delivery charge. There is no free-shipping threshold.
* **Cash on Delivery (COD)**: Available on select pincodes with a nominal verification fee.

### Tracking
Once dispatched, an SMS and email notification with your AWB tracking link will be automatically generated.`,
      isPublished: true,
      metaTitle: "Shipping & Delivery Policy | Dhanvantari Ayurvedic Agencies",
      metaDescription: "Learn about our pan-India delivery timeframes, flat ₹50 delivery charge, and tracking policies.",
    },
    {
      slug: "return-policy",
      title: "Refund & Return Policy",
      excerpt: "Simple, transparent guidelines for returns, replacements, and order cancellations.",
      content: `## Refund & Return Policy

We take utmost pride in the quality and authentic preparation of every item we ship. If an issue arises, here is how we assist:

* **Damaged or Tampered Shipments**: Report to care@dhanvantari.in within 48 hours of delivery with photos of the outer box and invoice.
* **Return Window**: 7 days from the date of physical receipt.
* **Refund Processing**: Approved refunds are credited to the original payment source within 5-7 working days.`,
      isPublished: true,
      metaTitle: "Refund & Return Policy | Dhanvantari Ayurvedic Agencies",
      metaDescription: "Review Dhanvantari's 7-day return, replacement, and customer-first refund guidelines.",
    },
  ];

  for (const page of demoPages) {
    await prisma.contentPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    });
  }
  console.log("✅ Demo CMS pages seeded with [slug]");

  // ─── CMS Blog Posts (with [slug]) ───────────────────────────
  const demoPosts = [
    {
      slug: "the-secret-of-bhringraj-for-hair-fall",
      title: "The Ancient Secret of Bhringraj for Hair Fall Control & Regrowth",
      excerpt: "Known in Ayurvedic texts as 'Keshraj' (King of Hair), Bhringraj has been the sovereign herbal remedy for alopecia, premature greying, and scalp health for millennia.",
      category: "Hair Care",
      tags: "Bhringraj, Hair Fall, Ayurvedic Oils, Scalp Health",
      authorName: "Dr. Arvind Shastri (Chief Vaidya)",
      coverImage: "https://images.unsplash.com/photo-1608248597359-543152d1c925?q=80&w=1200&auto=format&fit=crop",
      isPublished: true,
      publishedAt: new Date(),
      content: `## Why Bhringraj is Named the 'King of Hair'

In classical Ayurvedic texts, *Eclipta Alba* (commonly known as **Bhringraj**) is celebrated for its remarkable ability to penetrate hair follicles and balance excessive **Pitta Dosha**, the root cause of scalp inflammation, early thinning, and premature greying.

### 1. Enhances Scalp Micro-Circulation
When cooked in a virgin sesame or coconut oil base (*Taila Paka Vidhi*), Bhringraj delivers micronutrients directly to the roots, stimulating dormant follicles and inducing healthy anagen (growth) phase cycles.

### 2. Soothes Pitta-Induced Heat
Stress, spicy diets, and environmental toxins generate excess metabolic heat in the scalp. Bhringraj possesses cooling, grounding energies that pacify Pitta, calming hair root distress.

### 3. Deep Conditioning & Natural Lustre
Regular warm oil massages twice a week rebuild moisture barriers in hair shafts, preventing split ends and brittleness.

### How to Practice the Weekly Ritual
1. Warm 15–20ml of authentic Dhanvantari Bhringraj Taila.
2. Part your hair into sections and gently massage your scalp with circular fingertip motions for 10 minutes.
3. Allow the therapeutic herbs to permeate for at least 45 minutes (or overnight) before cleansing with a mild sulfate-free shampoo.`,
      metaTitle: "The Secret of Bhringraj for Hair Fall Control | Dhanvantari Journal",
      metaDescription: "Discover how classical Bhringraj hair oil reverses hair fall, calms Pitta dosha, and restores deep hair density.",
    },
    {
      slug: "understanding-the-three-doshas",
      title: "Ayurveda 101: Understanding Vata, Pitta, and Kapha",
      excerpt: "Your unique mind-body blueprint determines how you digest, think, and glow. Learn how to discover and balance your constitutional Doshas.",
      category: "Ayurvedic Rituals",
      tags: "Doshas, Vata, Pitta, Kapha, Wellness Guide",
      authorName: "Dr. Arvind Shastri (Chief Vaidya)",
      coverImage: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200&auto=format&fit=crop",
      isPublished: true,
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      content: `## The Biological Energies of Life

Ayurveda views every human being as a unique expression of the five universal elements: Space, Air, Fire, Water, and Earth. These combine into three primary bio-energies called **Doshas**:

### 1. Vata (Air + Space) — The Force of Movement
* **Qualities**: Light, cool, dry, agile, and subtle.
* **When Balanced**: Creative, enthusiastic, flexible, and energetic.
* **When Imbalanced**: Dry skin, brittle hair, anxiety, restlessness, and digestive gas.
* **Remedy**: Warm, grounding sesame oil massages (*Abhyanga*) and nourishing, cooked foods.

### 2. Pitta (Fire + Water) — The Force of Transformation
* **Qualities**: Hot, sharp, oily, intense, and spreading.
* **When Balanced**: Sharp intellect, radiant complexion, good digestion, and charismatic leadership.
* **When Imbalanced**: Acidity, skin rashes, hair thinning, anger, and inflammatory conditions.
* **Remedy**: Cooling herbs like Sandalwood, Rose water, Coconut oil, and calming meditation.

### 3. Kapha (Earth + Water) — The Force of Structure & Stability
* **Qualities**: Heavy, slow, cool, unctuous, and stable.
* **When Balanced**: Enduring stamina, deep empathy, lustrous thick hair, and robust immunity.
* **When Imbalanced**: Lethargy, sluggish metabolism, excess oiliness, and sinus congestion.
* **Remedy**: Warming spices like Ginger, invigorating dry herbal rubs, and regular active exercise.`,
      metaTitle: "Ayurveda 101: Vata, Pitta, and Kapha Guide | Dhanvantari",
      metaDescription: "Learn how your Ayurvedic dosha constitution guides your skin health, digestion, sleep, and lifestyle balance.",
    },
    {
      slug: "daily-dinacharya-routine",
      title: "Dinacharya: The Vedic Daily Ritual for Radiant Skin and Vitality",
      excerpt: "Aligning your daily waking hours with nature's circadian rhythms is the foundational secret to long-lasting vitality and inner peace.",
      category: "Daily Routine",
      tags: "Dinacharya, Morning Rituals, Abhyanga, Self Care",
      authorName: "Pooja Hegde (Ayurvedic Lifestyle Coach)",
      coverImage: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=1200&auto=format&fit=crop",
      isPublished: true,
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      content: `## The Art of Sacred Rhythm

*Dinacharya* (Dina = Day, Acharya = Conduct) is Ayurveda's system for syncing our biological clocks with natural solar energy. Practicing even three of these steps will revitalize your mornings:

### 1. Brahma Muhurta Waking (Before Sunrise)
Waking during the pre-dawn hour (roughly 45 minutes before sunrise) immerses the mind in pure *Sattva* (clarity and lightness).

### 2. Jivha Nirlekhana (Tongue Scraping)
Using a pure copper tongue cleaner to gently remove overnight metabolic toxins (*Ama*) before drinking water. This awakens digestive fire (*Agni*) and taste perception.

### 3. Ushapan (Warm Water Hydration)
Sipping a cup of warm water infused with a slice of fresh ginger or cumin to activate peristalsis naturally.

### 4. Abhyanga (Self-Oil Massage)
Applying warm herbal oil from scalp to toes for 5–10 minutes before showering shields the nervous system and bestows supple, youthful skin.`,
      metaTitle: "Dinacharya: The Vedic Morning Routine | Dhanvantari Journal",
      metaDescription: "Step-by-step guide to practicing Dinacharya, the Ayurvedic daily routine for energy, radiant skin, and peace.",
    },
  ];

  for (const post of demoPosts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {},
      create: post,
    });
  }
  console.log("✅ Demo CMS blog posts seeded with [slug]");

  // ─── Site Settings (Storefront Customizer) ───────────────────
  await prisma.siteSetting.upsert({
    where: { key: "announcement" },
    update: {},
    create: {
      key: "announcement",
      value: {
        isEnabled: true,
        text: "🌿 100% Authentic Ayurvedic Formulations — Flat ₹50 Delivery Charge on All Orders",
        linkUrl: "/shop",
        badgeText: "PURE AYURVEDA",
      },
    },
  });

  await prisma.siteSetting.upsert({
    where: { key: "info" },
    update: {},
    create: {
      key: "info",
      value: {
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
    },
  });

  await prisma.siteSetting.upsert({
    where: { key: "homeSections" },
    update: {},
    create: {
      key: "homeSections",
      value: {
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
    },
  });
  console.log("✅ Demo Storefront Customizer site settings seeded");

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
