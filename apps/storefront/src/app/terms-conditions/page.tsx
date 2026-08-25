import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsConditionsPage() {
  return <main className="section-container min-h-screen max-w-4xl py-12 md:py-20"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Legal</p><h1 className="section-heading mt-3">Terms & conditions</h1><p className="mt-6 leading-relaxed text-muted-foreground">This demo page is a placeholder for the approved Dhanvantari terms and conditions.</p></main>;
}
