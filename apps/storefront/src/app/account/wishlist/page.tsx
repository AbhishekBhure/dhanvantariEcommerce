"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { formatPrice, getImageUrl } from "@/lib/utils";

type WishlistEntry = { id: string; productId: string; product: { id: string; name: string; slug: string; price: number; mrp: number; isPublished: boolean; primaryImage: string | null } };

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { void api.get<{ data: { items: WishlistEntry[] } }>("/wishlist").then((response) => setItems(response.data.items)).catch((requestError) => setError(requestError instanceof ApiError ? requestError.message : "Could not load your wishlist.")).finally(() => setLoading(false)); }, []);
  async function remove(productId: string) { try { await api.delete(`/wishlist/${productId}`); setItems((current) => current.filter((item) => item.productId !== productId)); } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "Could not remove this product."); } }
  if (loading) return <main className="section-container py-24 text-center text-muted-foreground">Loading wishlist...</main>;
  return <main className="section-container min-h-screen py-10 md:py-16"><Link href="/account" className="text-sm text-muted-foreground">Back to account</Link><h1 className="section-heading mt-5">Wishlist</h1>{error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}{!items.length ? <div className="mt-8 border-y border-dashed py-16 text-center"><Heart className="mx-auto h-9 w-9 text-brand-600"/><p className="mt-4 text-muted-foreground">Products you save will appear here.</p><Link href="/shop" className="mt-5 inline-block text-sm font-semibold text-brand-700">Explore products</Link></div> : <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{items.map(({ product }) => <article key={product.id} className="border border-border"><Link href={`/products/${product.slug}`}><div className="relative aspect-square bg-muted"><Image src={getImageUrl(product.primaryImage)} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw"/></div><div className="p-4"><h2 className="font-semibold">{product.name.replace("[DEMO] ", "")}</h2><p className="mt-2 text-sm font-bold text-brand-700">{formatPrice(product.price)}</p></div></Link><div className="flex justify-end border-t border-border p-3"><button type="button" onClick={() => void remove(product.id)} aria-label={`Remove ${product.name} from wishlist`} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4"/></button></div></article>)}</div>}</main>;
}
