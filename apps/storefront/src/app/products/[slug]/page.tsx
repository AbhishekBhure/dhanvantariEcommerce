import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, Leaf } from "lucide-react";
import type { Product } from "@dhanvantari/shared-types";
import AddToCartButton from "./AddToCartButton";
import { calculateDiscount, formatPrice, getImageUrl } from "@/lib/utils";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000/api";

type ProductResponse = { data?: { product: Product } };

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
  return {
    title: product?.metaTitle ?? product?.name ?? "Product",
    description: product?.metaDescription ?? product?.shortDescription ?? undefined,
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

  const discount = calculateDiscount(product.mrp, product.price);
  const image = product.images[0];

  return (
    <main>
      <div className="section-container py-5">
        <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-brand-700">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to shop
        </Link>
      </div>
      <section className="section-container grid gap-10 pb-16 pt-4 md:grid-cols-2 md:gap-16 md:pb-24 md:pt-8">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          <Image src={getImageUrl(image?.url)} alt={image?.altText ?? product.name} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
        </div>
        <div className="flex flex-col justify-center">
          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wider text-brand-700">
            {product.categories.map((category) => <span key={category.id}>{category.name.replace("[DEMO] ", "")}</span>)}
          </div>
          <h1 className="section-heading mt-3">{product.name.replace("[DEMO] ", "")}</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{product.shortDescription}</p>
          <div className="mt-7 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-brand-700">{formatPrice(product.price)}</span>
            {discount > 0 && <><span className="text-base text-muted-foreground line-through">{formatPrice(product.mrp)}</span><span className="text-sm font-semibold text-gold-600">{discount}% off</span></>}
          </div>
          <div className="mt-7 max-w-sm"><AddToCartButton productId={product.id} disabled={product.stock === 0} /></div>
          <p className="mt-3 text-sm text-muted-foreground">{product.stock > 0 ? `${product.stock} available` : "Currently unavailable"}</p>
          <div className="mt-8 grid gap-3 border-y border-border py-5 text-sm text-muted-foreground sm:grid-cols-2">
            <span className="flex items-center gap-2"><Leaf className="h-4 w-4 text-brand-600" aria-hidden="true" /> Ayurvedic formulation</span>
            <span className="flex items-center gap-2"><Check className="h-4 w-4 text-brand-600" aria-hidden="true" /> Quality assured</span>
          </div>
        </div>
      </section>
      <section className="border-t border-border bg-brand-50/60">
        <div className="section-container grid gap-10 py-14 md:grid-cols-2 md:py-20">
          <div><h2 className="font-display text-3xl font-bold">Ingredients</h2><p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">{product.ingredients ?? "Details coming soon."}</p></div>
          <div><h2 className="font-display text-3xl font-bold">How to use</h2><p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">{product.usageInstructions ?? "Usage instructions coming soon."}</p></div>
        </div>
      </section>
    </main>
  );
}
