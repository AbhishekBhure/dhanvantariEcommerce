import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import type { Category, ProductListItem } from "@dhanvantari/shared-types";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000/api";

type CategoryResponse = { data?: { category: Category } };
type ProductsResponse = { data?: { products: ProductListItem[]; total: number } };

async function getCategory(slug: string) {
  try {
    const [categoryResponse, productsResponse] = await Promise.all([
      fetch(`${API_URL}/categories/${slug}`, { next: { revalidate: 600 } }),
      fetch(`${API_URL}/products?categorySlug=${encodeURIComponent(slug)}&page=1&pageSize=24`, { next: { revalidate: 60 } }),
    ]);
    if (!categoryResponse.ok || !productsResponse.ok) return null;
    const category = (await categoryResponse.json()) as CategoryResponse;
    const products = (await productsResponse.json()) as ProductsResponse;
    if (!category.data?.category) return null;
    return { category: category.data.category, products: products.data?.products ?? [], total: products.data?.total ?? 0 };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const result = await getCategory((await params).slug);
  return {
    title: result?.category.metaTitle ?? result?.category.name ?? "Category",
    description: result?.category.metaDescription ?? result?.category.description ?? undefined,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const result = await getCategory((await params).slug);
  if (!result) return <main className="section-container py-24 text-center"><h1 className="section-heading">Category not found</h1><Link href="/shop" className="mt-6 inline-block text-sm font-semibold text-brand-700">Back to shop</Link></main>;

  const { category, products, total } = result;
  return <main className="min-h-screen"><section className="border-b border-border bg-brand-50/70"><div className="section-container py-12 md:py-16"><Link href="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-700"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> All products</Link><p className="mt-8 text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Collection</p><h1 className="section-heading mt-3">{category.name.replace("[DEMO] ", "")}</h1><p className="section-subheading mt-3">{category.description ?? "Explore this collection from Dhanvantari."}</p></div></section><section className="section-container py-10 md:py-14"><p className="mb-6 text-sm text-muted-foreground">{total} {total === 1 ? "product" : "products"}</p>{products.length > 0 ? <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="border-y border-dashed border-border py-20 text-center"><h2 className="font-display text-3xl font-bold">Nothing here yet</h2><p className="mt-3 text-muted-foreground">Products in this collection will appear soon.</p></div>}</section></main>;
}
