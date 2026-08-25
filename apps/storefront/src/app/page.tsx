import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Leaf, Shield, Truck, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/product/ProductCard";
import type { ProductListItem, Banner, Category } from "@dhanvantari/shared-types";

export const metadata: Metadata = {
  title: "Pure Ayurveda, Modern Living | Dhanvantari Ayurvedic Agencies",
  description:
    "Discover authentic Ayurvedic products crafted with traditional formulations. Dhanvantari Ayurvedic Agencies — premium hair care, skin care, and wellness for modern India.",
};

// ─── Data fetching ────────────────────────────────────────────
const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000/api";

async function getFeaturedProducts(): Promise<ProductListItem[]> {
  try {
    const res = await fetch(`${API_URL}/products/featured`, {
      next: { revalidate: 300 }, // revalidate every 5 minutes
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { data: { products: ProductListItem[] } };
    return data.data.products;
  } catch {
    return [];
  }
}

async function getBanners(): Promise<Banner[]> {
  try {
    const res = await fetch(`${API_URL}/banners`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { data: { banners: Banner[] } };
    return data.data.banners;
  } catch {
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/categories`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { data: { categories: Category[] } };
    return data.data.categories;
  } catch {
    return [];
  }
}

const WHY_US = [
  {
    icon: Leaf,
    title: "100% Natural",
    description: "Formulated with authentic Ayurvedic herbs, free from harmful chemicals.",
  },
  {
    icon: Shield,
    title: "Quality Assured",
    description: "Every product is tested and manufactured under strict quality standards.",
  },
  {
    icon: Award,
    title: "Traditional Wisdom",
    description: "Centuries of Ayurvedic knowledge backed by modern manufacturing.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description: "Free shipping on orders above ₹499, delivered pan-India.",
  },
];

// ─── Page Component ───────────────────────────────────────────
export default async function HomePage() {
  const [featuredProducts, banners, categories] = await Promise.all([
    getFeaturedProducts(),
    getBanners(),
    getCategories(),
  ]);

  const heroBanner = banners[0];

  return (
    <div className="flex flex-col">
      {/* ─── Hero Section ─────────────────────────────────────── */}
      <section
        className="relative min-h-[60vh] md:min-h-[75vh] flex items-center overflow-hidden"
        aria-label="Hero"
      >
        {/* Background */}
        {heroBanner ? (
          <Image
            src={heroBanner.imageUrl}
            alt={heroBanner.title}
            fill
            className="object-cover"
            priority
            fetchPriority="high"
          />
        ) : (
          <div className="absolute inset-0 bg-hero-gradient" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950/90 via-brand-900/70 to-transparent" />

        <div className="relative section-container py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-gold-500/20 text-gold-300 border border-gold-500/30 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Leaf className="w-4 h-4" aria-hidden="true" />
              <span>Pure Ayurvedic Formulations</span>
            </div>

            <h1 className="section-heading text-white text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight">
              {heroBanner?.title ?? "Pure Ayurveda.\nModern Living."}
            </h1>

            <p className="text-brand-200 text-lg md:text-xl mb-8 leading-relaxed max-w-xl">
              {heroBanner?.subtitle ??
                "Discover time-tested Ayurvedic formulations crafted for the way you live today."}
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/shop">
                <Button
                  size="lg"
                  className="bg-gold-500 hover:bg-gold-600 text-white shadow-lg hover:shadow-xl"
                  id="hero-shop-now"
                >
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>
              <Link href="/about">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10"
                  id="hero-our-story"
                >
                  Our Story
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Why Dhanvantari ──────────────────────────────────── */}
      <section className="bg-brand-50 py-12 md:py-16" aria-labelledby="why-us-heading">
        <div className="section-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {WHY_US.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col items-center text-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-600 text-white">
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <h2 className="font-semibold text-sm md:text-base text-foreground">{title}</h2>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed hidden md:block">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Categories ───────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="py-16 md:py-20" aria-labelledby="categories-heading">
          <div className="section-container">
            <div className="text-center mb-10">
              <h2 id="categories-heading" className="section-heading">
                Shop by Category
              </h2>
              <p className="section-subheading mx-auto mt-3">
                Explore our range of Ayurvedic products for every wellness need
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {categories.slice(0, 4).map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted"
                  id={`category-${category.slug}`}
                >
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-brand-800" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-950/80 via-brand-950/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-semibold text-sm md:text-base">
                      {category.name.replace("[DEMO] ", "")}
                    </h3>
                    {category._count && (
                      <p className="text-brand-200 text-xs mt-1">
                        {category._count.products} products
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Featured Products ────────────────────────────────── */}
      {featuredProducts.length > 0 && (
        <section
          className="py-16 md:py-20 bg-gradient-to-b from-muted/30 to-background"
          aria-labelledby="featured-heading"
        >
          <div className="section-container">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 id="featured-heading" className="section-heading">
                  Featured Products
                </h2>
                <p className="section-subheading mt-2">
                  Handpicked Ayurvedic essentials for your wellness journey
                </p>
              </div>
              <Link
                href="/shop"
                className="hidden md:flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-900 transition-colors"
              >
                View all
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            <div className="mt-8 text-center md:hidden">
              <Link href="/shop">
                <Button variant="outline" id="featured-view-all-mobile">
                  View All Products
                  <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── Brand Story Banner ───────────────────────────────── */}
      <section
        className="relative py-24 md:py-32 overflow-hidden bg-brand-900"
        aria-labelledby="story-heading"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15)_0%,transparent_70%)]" />
        </div>
        <div className="relative section-container text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-700 mb-6">
            <Leaf className="w-7 h-7 text-gold-400" aria-hidden="true" />
          </div>
          <h2 id="story-heading" className="section-heading text-white mb-6">
            Rooted in Tradition,
            <br />
            <span className="text-gold-400">Built for Today</span>
          </h2>
          <p className="text-brand-200 text-lg leading-relaxed mb-8">
            {/* DEMO — Replace with actual brand story */}
            At Dhanvantari Ayurvedic Agencies, we combine centuries of Ayurvedic wisdom with
            modern quality standards to bring you authentic wellness products that truly work.
          </p>
          <Link href="/about">
            <Button
              size="lg"
              variant="gold"
              id="story-learn-more"
            >
              Learn Our Story
              <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
