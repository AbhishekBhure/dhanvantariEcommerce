import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Order confirmed",
};

export default async function OrderConfirmationPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  return <main className="section-container flex min-h-[calc(100vh-9rem)] items-center justify-center py-16"><section className="w-full max-w-xl border border-border bg-brand-50/60 px-6 py-12 text-center md:px-12"><CheckCircle2 className="mx-auto h-14 w-14 text-brand-600" aria-hidden="true" /><p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Order confirmed</p><h1 className="mt-3 font-display text-4xl font-bold">Thank you for your order.</h1><p className="mt-4 text-muted-foreground">Your cash-on-delivery order has been placed successfully.</p><p className="mt-6 text-sm text-muted-foreground">Order number</p><p className="mt-1 text-lg font-bold text-foreground">{orderNumber}</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/shop" className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700">Continue shopping</Link><Link href="/account/orders" className="rounded-lg border border-brand-600 px-6 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50">View orders</Link></div></section></main>;
}
