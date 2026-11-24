"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { api, ApiError } from "@/lib/api";

type Review = { id: string; rating: number; title: string | null; body: string | null; isApproved: boolean; createdAt: string; user: { name: string; email: string | null }; product: { name: string; slug: string } };
export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pendingOnly, setPendingOnly] = useState(true);
  const [error, setError] = useState("");
  async function load() { try { const response = await api<{ data: { reviews: Review[] } }>(`/admin/reviews?pending=${pendingOnly}`); setReviews(response.data.reviews); } catch (e) { setError(e instanceof ApiError ? e.message : "Could not load reviews."); } }
  useEffect(() => { void load(); }, [pendingOnly]);
  async function moderate(review: Review, approve: boolean) { try { await api(`/admin/reviews/${review.id}`, { method: "PATCH", body: JSON.stringify({ isApproved: approve }) }); await load(); } catch (e) { setError(e instanceof ApiError ? e.message : "Could not update review."); } }
  async function remove(review: Review) { if (!window.confirm("Permanently remove this review?")) return; try { await api(`/admin/reviews/${review.id}`, { method: "DELETE" }); await load(); } catch (e) { setError(e instanceof ApiError ? e.message : "Could not remove review."); } }
  return <AdminLayout title="Product reviews" subtitle="Customer feedback moderation"><div className="mb-5 flex items-center gap-3"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={pendingOnly} onChange={(event) => setPendingOnly(event.target.checked)} />Pending only</label></div>{error && <p role="alert" className="mb-4 text-sm text-red-700">{error}</p>}<div className="divide-y border bg-white">{reviews.map((review) => <article key={review.id} className="grid gap-3 p-5 md:grid-cols-[1fr_auto]"><div><p className="text-xs font-semibold text-amber-700">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)} · {review.product.name}</p><h2 className="mt-2 font-semibold">{review.title || "Customer review"}</h2><p className="mt-2 whitespace-pre-line text-sm text-slate-600">{review.body}</p><p className="mt-3 text-xs text-slate-500">{review.user.name}{review.user.email ? ` · ${review.user.email}` : ""} · {new Date(review.createdAt).toLocaleDateString("en-IN")}</p></div><div className="flex items-center gap-3 md:flex-col md:items-end">{review.isApproved ? <button type="button" onClick={() => void moderate(review, false)} className="text-sm font-semibold text-amber-700">Unpublish</button> : <button type="button" onClick={() => void moderate(review, true)} className="text-sm font-semibold text-emerald-700">Approve</button>}<button type="button" onClick={() => void remove(review)} className="text-sm text-red-700">Delete</button></div></article>)}{!reviews.length && <p className="py-14 text-center text-sm text-slate-500">No reviews in this view.</p>}</div></AdminLayout>;
}
