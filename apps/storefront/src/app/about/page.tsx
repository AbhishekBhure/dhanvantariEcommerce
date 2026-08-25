import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About Dhanvantari", description: "Learn about Dhanvantari Ayurvedic Agencies." };

export default function AboutPage() {
  return <main className="section-container min-h-screen py-12 md:py-20"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Our story</p><h1 className="section-heading mt-3 max-w-3xl">Rooted in Ayurveda. Made for modern rituals.</h1><p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">Dhanvantari Ayurvedic Agencies brings traditional Ayurvedic formulations into everyday life with thoughtful products and dependable quality.</p><div className="mt-14 grid gap-8 border-y border-border py-10 md:grid-cols-3"><div><h2 className="font-display text-2xl font-bold">Tradition</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Inspired by time-tested Ayurvedic knowledge.</p></div><div><h2 className="font-display text-2xl font-bold">Quality</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Made with care and clear product information.</p></div><div><h2 className="font-display text-2xl font-bold">Everyday wellness</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">Simple essentials for daily routines.</p></div></div><Link href="/shop" className="mt-10 inline-block text-sm font-semibold text-brand-700">Explore the collection</Link></main>;
}
