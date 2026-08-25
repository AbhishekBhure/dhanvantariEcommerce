import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shipping Policy" };

export default function ShippingPolicyPage() {
  return <main className="section-container min-h-screen max-w-4xl py-12 md:py-20"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Policy</p><h1 className="section-heading mt-3">Shipping policy</h1><p className="mt-6 leading-relaxed text-muted-foreground">This demo policy is a placeholder and must be replaced with approved Dhanvantari shipping terms before launch.</p><div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground"><section><h2 className="font-display text-2xl font-bold text-foreground">Delivery timeline</h2><p className="mt-3">Orders are intended for pan-India delivery. Final delivery timelines, serviceable locations, and carrier details will be confirmed by the Dhanvantari team.</p></section><section><h2 className="font-display text-2xl font-bold text-foreground">Shipping charges</h2><p className="mt-3">The demo store offers free shipping above ₹499 and applies a ₹49 charge below that amount.</p></section></div></main>;
}
