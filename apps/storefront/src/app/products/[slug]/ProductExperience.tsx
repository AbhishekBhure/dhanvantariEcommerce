"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Heart, Star } from "lucide-react";
import type { Product } from "@dhanvantari/shared-types";
import { api, ApiError } from "@/lib/api";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import AddToCartButton from "./AddToCartButton";

type ProductWithReviews = Product & { reviews?: Array<{ id: string; rating: number; title: string | null; body: string | null; createdAt: string; user: { name: string } }> };

export default function ProductExperience({ product }: { product: ProductWithReviews }) {
  const user = useAppSelector((state) => state.auth.user);
  const images = product.images.length ? product.images : [{ id: "fallback", productId: product.id, url: "", altText: product.name, sortOrder: 0 }];
  const variants = product.variants.filter((variant) => variant.isAvailable);
  const [imageIndex, setImageIndex] = useState(0);
  const [variantId, setVariantId] = useState("");
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistError, setWishlistError] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const selectedVariant = variants.find((variant) => variant.id === variantId);
  const price = selectedVariant?.price ?? product.price;
  const mrp = selectedVariant?.mrp ?? product.mrp;
  const stock = selectedVariant?.stock ?? product.stock;
  const discount = mrp > 0 ? Math.round((1 - price / mrp) * 100) : 0;

  useEffect(() => {
    void api.get<{ data: { items: Array<{ productId: string }> } }>("/wishlist")
      .then((response) => setIsWishlisted(response.data.items.some((item) => item.productId === product.id)))
      .catch(() => setIsWishlisted(false));
  }, [product.id]);

  async function toggleWishlist() {
    setWishlistError("");
    try {
      if (isWishlisted) await api.delete(`/wishlist/${product.id}`);
      else await api.post(`/wishlist/${product.id}`);
      setIsWishlisted(!isWishlisted);
    } catch (error) {
      setWishlistError(error instanceof ApiError && error.status === 401 ? "Sign in to save this product." : error instanceof ApiError ? error.message : "Could not update wishlist.");
    }
  }

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setReviewError(""); setReviewMessage(""); setIsSubmittingReview(true);
    try {
      const response = await api.post<{ message?: string }>(`/reviews/products/${product.id}`, { rating, title: reviewTitle, body: reviewBody });
      setReviewMessage(response.message ?? "Review submitted for moderation."); setReviewTitle(""); setReviewBody("");
    } catch (error) { setReviewError(error instanceof ApiError ? error.message : "Could not submit review."); }
    finally { setIsSubmittingReview(false); }
  }

  return <>
    <section className="section-container grid gap-10 pb-16 pt-4 md:grid-cols-2 md:gap-16 md:pb-24 md:pt-8">
      <div>
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted"><Image src={getImageUrl(images[imageIndex]?.url)} alt={images[imageIndex]?.altText ?? product.name} fill priority className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" /></div>
        {images.length > 1 && <div className="mt-3 grid grid-cols-5 gap-2">{images.map((image, index) => <button key={image.id} type="button" onClick={() => setImageIndex(index)} aria-label={`View product image ${index + 1}`} className={`relative aspect-square overflow-hidden border ${imageIndex === index ? "border-brand-600" : "border-border"}`}><Image src={getImageUrl(image.url)} alt={image.altText ?? `${product.name} image ${index + 1}`} fill className="object-cover" sizes="100px" /></button>)}</div>}
      </div>
      <div className="flex flex-col justify-center">
        <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wider text-brand-700">{product.categories.map((category) => <span key={category.id}>{category.name.replace("[DEMO] ", "")}</span>)}</div>
        <h1 className="section-heading mt-3">{product.name.replace("[DEMO] ", "")}</h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{product.shortDescription}</p>
        {variants.length > 0 && <label className="mt-6 block max-w-sm text-sm font-medium">Choose size or variant<select value={variantId} onChange={(event) => setVariantId(event.target.value)} className="mt-2 h-11 w-full border border-input bg-background px-3 text-sm"><option value="">Select an option</option>{variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.name} · {formatPrice(variant.price)}{variant.stock <= 0 ? " · Out of stock" : ""}</option>)}</select></label>}
        <div className="mt-7 flex items-baseline gap-3"><span className="text-3xl font-bold text-brand-700">{formatPrice(price)}</span>{discount > 0 && <><span className="text-base text-muted-foreground line-through">{formatPrice(mrp)}</span><span className="text-sm font-semibold text-gold-600">{discount}% off</span></>}</div>
        <div className="mt-7 flex max-w-sm gap-3"><div className="flex-1"><AddToCartButton productId={product.id} variantId={selectedVariant?.id} disabled={stock === 0 || (variants.length > 0 && !selectedVariant)} /></div><button type="button" onClick={() => void toggleWishlist()} aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"} className={`flex h-12 w-12 items-center justify-center border ${isWishlisted ? "border-brand-600 text-brand-700" : "border-border text-muted-foreground"}`}><Heart className="h-5 w-5" fill={isWishlisted ? "currentColor" : "none"} /></button></div>
        {wishlistError && <p role="alert" className="mt-2 text-sm text-destructive">{wishlistError}</p>}
        <p className="mt-3 text-sm text-muted-foreground">{stock > 0 ? `${stock} available` : "Currently unavailable"}</p>
      </div>
    </section>
    <section className="border-t border-border bg-brand-50/60"><div className="section-container grid gap-10 py-14 md:grid-cols-2 md:py-20"><div><h2 className="font-display text-3xl font-bold">Ingredients</h2><p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">{product.ingredients ?? "Details coming soon."}</p></div><div><h2 className="font-display text-3xl font-bold">How to use</h2><p className="mt-4 whitespace-pre-line leading-relaxed text-muted-foreground">{product.usageInstructions ?? "Usage instructions coming soon."}</p></div></div></section>
    <section className="section-container py-14"><div className="grid gap-10 lg:grid-cols-[1fr_380px]"><div><h2 className="font-display text-3xl font-bold">Customer reviews</h2>{product.reviews?.length ? <div className="mt-5 divide-y border-y border-border">{product.reviews.map((review) => <article key={review.id} className="py-5"><div className="flex items-center gap-1 text-gold-600" aria-label={`${review.rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} className="h-4 w-4" fill={index < review.rating ? "currentColor" : "none"} />)}</div>{review.title && <h3 className="mt-2 font-semibold">{review.title}</h3>}<p className="mt-2 text-sm leading-relaxed text-muted-foreground">{review.body}</p><p className="mt-2 text-xs text-muted-foreground">{review.user.name} · {new Date(review.createdAt).toLocaleDateString("en-IN")}</p></article>)}</div> : <p className="mt-4 text-sm text-muted-foreground">No approved reviews yet.</p>}</div>
      <div className="border border-border p-5"><h3 className="font-display text-xl font-bold">Review this product</h3>{user ? <form onSubmit={submitReview} className="mt-4 space-y-4"><label className="block text-sm font-medium">Rating<select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="mt-1 h-10 w-full border border-input bg-white px-3">{[5,4,3,2,1].map((value) => <option key={value} value={value}>{value} star{value > 1 ? "s" : ""}</option>)}</select></label><label className="block text-sm font-medium">Title<input value={reviewTitle} onChange={(event) => setReviewTitle(event.target.value)} maxLength={100} className="mt-1 h-10 w-full border border-input px-3" /></label><label className="block text-sm font-medium">Review<textarea required minLength={10} maxLength={2000} value={reviewBody} onChange={(event) => setReviewBody(event.target.value)} rows={4} className="mt-1 w-full border border-input p-3" /></label>{reviewMessage && <p role="status" className="text-sm text-brand-700">{reviewMessage}</p>}{reviewError && <p role="alert" className="text-sm text-destructive">{reviewError}</p>}<button disabled={isSubmittingReview} className="h-10 w-full bg-brand-600 text-sm font-semibold text-white disabled:opacity-50">{isSubmittingReview ? "Submitting..." : "Submit review"}</button></form> : <p className="mt-3 text-sm text-muted-foreground">Sign in after delivery to review this product.</p>}</div></div></section>
  </>;
}
