import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownUp, Search, SlidersHorizontal } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import type { Category, ProductListItem } from "@dhanvantari/shared-types";

export const metadata: Metadata = {
  title: "Shop Ayurvedic Products | Dhanvantari",
  description: "Browse Dhanvantari Ayurvedic products for hair care, skin care, and everyday wellness.",
};

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000/api";

type ShopSearchParams = {
  search?: string;
  category?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "name_asc";
};

type ProductResponse = {
  data?: {
    products: ProductListItem[];
    total: number;
    totalPages: number;
  };
};

type CategoryResponse = { data?: { categories: Category[] } };

async function getShopData(params: ShopSearchParams) {
  const query = new URLSearchParams({ page: "1", pageSize: "24" });
  if (params.search) query.set("search", params.search);
  if (params.category) query.set("categorySlug", params.category);
  if (params.sort) query.set("sortBy", params.sort);

  try {
    const [productsResponse, categoriesResponse] = await Promise.all([
      fetch(`${API_URL}/products?${query.toString()}`, { next: { revalidate: 60 } }),
      fetch(`${API_URL}/categories`, { next: { revalidate: 600 } }),
    ]);

    if (!productsResponse.ok || !categoriesResponse.ok) {
      return { products: [], total: 0, categories: [] };
    }

    const products = (await productsResponse.json()) as ProductResponse;
    const categories = (await categoriesResponse.json()) as CategoryResponse;
    return {
      products: products.data?.products ?? [],
      total: products.data?.total ?? 0,
      categories: categories.data?.categories ?? [],
    };
  } catch {
    return { products: [], total: 0, categories: [] };
  }
}

function buildShopUrl(params: ShopSearchParams, changes: Partial<ShopSearchParams>) {
  const nextParams = { ...params, ...changes };
  const query = new URLSearchParams();
  if (nextParams.search) query.set("search", nextParams.search);
  if (nextParams.category) query.set("category", nextParams.category);
  if (nextParams.sort && nextParams.sort !== "newest") query.set("sort", nextParams.sort);
  const queryString = query.toString();
  return queryString ? `/shop?${queryString}` : "/shop";
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<ShopSearchParams>;
}) {
  const params = await searchParams;
  const activeSort = params.sort ?? "newest";
  const { products, total, categories } = await getShopData(params);

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-brand-50/70">
        <div className="section-container py-12 md:py-16">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">The collection</p>
          <h1 className="section-heading mt-3">Shop Ayurveda for every day</h1>
          <p className="section-subheading mt-3">
            Thoughtfully made essentials for hair care, skin care, and everyday wellness.
          </p>
        </div>
      </section>

      <section className="section-container py-8 md:py-12" aria-label="Product catalogue">
        <div className="flex flex-col gap-5 border-b border-border pb-6 md:flex-row md:items-center md:justify-between">
          <form action="/shop" className="flex w-full max-w-xl gap-2" role="search">
            <label className="sr-only" htmlFor="shop-search">Search products</label>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id="shop-search"
                name="search"
                defaultValue={params.search}
                placeholder="Search products"
                className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {params.category && <input type="hidden" name="category" value={params.category} />}
              {activeSort !== "newest" && <input type="hidden" name="sort" value={activeSort} />}
            </div>
            <Button type="submit" size="sm">Search</Button>
          </form>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            <span>{total} {total === 1 ? "product" : "products"}</span>
            <span aria-hidden="true">·</span>
            <ArrowDownUp className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Sort products</span>
            <details className="relative">
              <summary className="cursor-pointer list-none font-medium text-foreground">
                {activeSort === "price_asc"
                  ? "Price: low to high"
                  : activeSort === "price_desc"
                    ? "Price: high to low"
                    : activeSort === "name_asc"
                      ? "Name: A to Z"
                      : "Newest"}
              </summary>
              <div className="absolute right-0 z-10 mt-2 min-w-48 rounded-lg border border-border bg-background p-1 shadow-lg">
                {([
                  ["newest", "Newest"],
                  ["price_asc", "Price: low to high"],
                  ["price_desc", "Price: high to low"],
                  ["name_asc", "Name: A to Z"],
                ] as const).map(([value, label]) => (
                  <Link key={value} href={buildShopUrl(params, { sort: value })} className="block rounded-md px-3 py-2 text-sm hover:bg-muted">
                    {label}
                  </Link>
                ))}
              </div>
            </details>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto py-5" aria-label="Product categories">
          <Link href={buildShopUrl(params, { category: undefined })} className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${!params.category ? "border-brand-600 bg-brand-600 text-white" : "border-border hover:border-brand-400"}`}>
            All products
          </Link>
          {categories.filter((category) => category.isPublished).map((category) => (
            <Link
              key={category.id}
              href={buildShopUrl(params, { category: category.slug })}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium ${params.category === category.slug ? "border-brand-600 bg-brand-600 text-white" : "border-border hover:border-brand-400"}`}
            >
              {category.name.replace("[DEMO] ", "")}
            </Link>
          ))}
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="border-y border-dashed border-border py-20 text-center">
            <h2 className="font-display text-3xl font-bold">Nothing here yet</h2>
            <p className="mx-auto mt-3 max-w-md text-muted-foreground">
              {params.search || params.category ? "Try a different search or browse the full collection." : "Products will appear here once the catalogue is published."}
            </p>
            {(params.search || params.category) && <Link href="/shop" className="mt-6 inline-block text-sm font-semibold text-brand-700 hover:text-brand-900">View all products</Link>}
          </div>
        )}
      </section>
    </main>
  );
}
