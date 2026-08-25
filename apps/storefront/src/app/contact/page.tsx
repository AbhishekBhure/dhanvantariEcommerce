import type { Metadata } from "next";

export const metadata: Metadata = { title: "Contact Us", description: "Contact Dhanvantari Ayurvedic Agencies." };

export default function ContactPage() {
  return <main className="section-container min-h-screen py-12 md:py-20"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Get in touch</p><h1 className="section-heading mt-3">We are here to help.</h1><p className="mt-5 max-w-xl leading-relaxed text-muted-foreground">For questions about products, orders, or delivery, reach us using the details below.</p><div className="mt-12 grid max-w-2xl gap-5 sm:grid-cols-2"><div className="border border-border p-6"><h2 className="font-display text-2xl font-bold">Email</h2><a href="mailto:info@dhanvantari.in" className="mt-3 block text-sm text-brand-700">info@dhanvantari.in</a></div><div className="border border-border p-6"><h2 className="font-display text-2xl font-bold">Phone</h2><a href="tel:+91XXXXXXXXXX" className="mt-3 block text-sm text-brand-700">+91-XXXX-XXXXXX</a></div></div></main>;
}
