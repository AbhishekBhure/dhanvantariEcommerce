"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { loadMyOrders } from "@/store/orderSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function OrdersPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items: orders, isLoading, error } = useAppSelector((state) => state.orders);

  useEffect(() => {
    void dispatch(loadMyOrders()).then((result) => {
      if (loadMyOrders.rejected.match(result) && result.error.message?.includes("401")) router.replace("/login");
    });
  }, [dispatch, router]);

  if (isLoading) return <main className="section-container py-24 text-center text-muted-foreground">Loading your orders...</main>;
  return <main className="section-container min-h-screen py-10 md:py-16"><Link href="/account" className="text-sm font-medium text-muted-foreground hover:text-brand-700">Back to account</Link><h1 className="section-heading mt-5">Your orders</h1>{error && <p role="alert" className="mt-6 text-sm text-destructive">{error}</p>}{!error && !orders.length && <div className="border-y border-dashed border-border py-20 text-center"><Package className="mx-auto h-10 w-10 text-brand-600" aria-hidden="true" /><h2 className="mt-5 font-display text-3xl font-bold">No orders yet</h2><p className="mt-3 text-muted-foreground">Your completed purchases will appear here.</p><Link href="/shop" className="mt-6 inline-block text-sm font-semibold text-brand-700">Start shopping</Link></div>}{orders.length > 0 && <div className="mt-8 divide-y divide-border border-y border-border">{orders.map((order) => <Link key={order.id} href={`/account/orders/${order.id}`} className="flex items-center gap-4 py-5 hover:bg-brand-50/60"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-50"><Package className="h-5 w-5 text-brand-600" aria-hidden="true" /></div><div className="min-w-0 flex-1"><p className="font-semibold">{order.orderNumber}</p><p className="mt-1 text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("en-IN")} · {order.items[0]?.productName ?? "Order"}{order.items.length > 1 ? ` + ${order.items.length - 1} more` : ""}</p></div><div className="text-right"><p className="font-semibold">{formatPrice(order.total)}</p><p className="mt-1 text-xs font-medium uppercase tracking-wider text-brand-700">{order.status.replaceAll("_", " ")}</p></div><ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" /></Link>)}</div>}</main>;
}
