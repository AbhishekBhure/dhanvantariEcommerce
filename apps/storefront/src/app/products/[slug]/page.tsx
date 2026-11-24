import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Product } from "@dhanvantari/shared-types";
import ProductExperience from "./ProductExperience";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000/api";

type ProductResponse = { data?: { product: Product & { reviews?: Array<{ id: string; rating: number; title: string | null; body: string | null; createdAt: string; user: { name: string } }> } } };

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const response = await fetch(`${API_URL}/products/${slug}`, { next: { revalidate: 60 } });
    if (!response.ok) return null;
    const data = (await response.json()) as ProductResponse;
    return data.data?.product ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  const title = product?.metaTitle ?? product?.name ?? "Product";
  const description = product?.metaDescription ?? product?.shortDescription ?? undefined;
  const image = product?.images[0]?.url;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(image ? { images: [{ url: image, alt: product?.name }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await getProduct((await params).slug);

  if (!product) {
    return (
      <main className="section-container py-24 text-center">
        <h1 className="section-heading">Product not found</h1>
        <p className="mt-3 text-muted-foreground">This product may no longer be available.</p>
        <Link href="/shop" className="mt-6 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-900">Back to shop</Link>
      </main>
    );
  }

  return (
    <main>
      <div className="section-container py-5">
        <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to shop
        </Link>
      </div>
      <ProductExperience product={product} />
    </main>
  );
}
