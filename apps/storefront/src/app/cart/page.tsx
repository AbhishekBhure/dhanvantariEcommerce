import type { Metadata } from "next";
import CartContent from "./CartContent";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review the Ayurvedic products in your Dhanvantari cart.",
};

export default function CartPage() {
  return (
    <main className="section-container min-h-screen py-10 md:py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Your selections</p>
      <h1 className="section-heading mt-3">Shopping cart</h1>
      <div className="mt-10"><CartContent /></div>
    </main>
  );
}
