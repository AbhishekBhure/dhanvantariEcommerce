import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Leaf, Shield, Award } from "lucide-react";
import type { ContentPage } from "@dhanvantari/shared-types";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000/api";

async function getAboutPage(): Promise<ContentPage | null> {
  try {
    const res = await fetch(`${API_URL}/pages/about`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: { page: ContentPage } };
    return json.data.page;
  } catch {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getAboutPage();
  return {
    title: page?.metaTitle || "About Us | Dhanvantari Ayurvedic Agencies",
    description:
      page?.metaDescription ||
      page?.excerpt ||
      "Learn about Dhanvantari Ayurvedic Agencies, our pure herbal preparations, and authentic Vedic healing.",
  };
}

export default async function AboutPage() {
  const page = await getAboutPage();

  if (page) {
    return (
      <main className="section-container min-h-screen py-12 md:py-20 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full mb-4">
          <Leaf className="w-3.5 h-3.5 text-brand-600" />
          <span>Our Story</span>
        </div>
        <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
          {page.title}
        </h1>
        {page.excerpt && (
          <p className="mt-4 text-lg md:text-xl text-muted-foreground leading-relaxed">
            {page.excerpt}
          </p>
        )}

        <div className="mt-10 border-t border-border pt-10 prose prose-lg max-w-none text-foreground/90 leading-relaxed space-y-6">
          {page.content.split("\n\n").map((block, idx) => {
            const trimmed = block.trim();
            if (trimmed.startsWith("## ")) {
              return (
                <h2 key={idx} className="font-display text-2xl md:text-3xl font-bold text-foreground mt-8 mb-4 border-b border-border pb-2">
                  {trimmed.replace("## ", "")}
                </h2>
              );
            }
            if (trimmed.startsWith("### ")) {
              return (
                <h3 key={idx} className="font-display text-xl font-bold text-foreground mt-6 mb-3">
                  {trimmed.replace("### ", "")}
                </h3>
              );
            }
            if (trimmed.startsWith("> ")) {
              return (
                <blockquote key={idx} className="border-l-4 border-brand-600 pl-4 py-1 italic text-muted-foreground my-4 bg-brand-50/50 rounded-r-lg">
                  {trimmed.replace("> ", "")}
                </blockquote>
              );
            }
            if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
              const items = trimmed.split("\n").map((line) => line.replace(/^[*\-]\s+/, ""));
              return (
                <ul key={idx} className="list-disc pl-6 space-y-2 my-4">
                  {items.map((it, itemIdx) => (
                    <li key={itemIdx} className="text-muted-foreground">{it}</li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={idx} className="text-base md:text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {trimmed}
              </p>
            );
          })}
        </div>

        <div className="mt-14 pt-8 border-t border-border flex items-center justify-between">
          <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-900">
            Explore the Collection <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/pages/ayurvedic-heritage" className="text-xs text-muted-foreground hover:text-foreground">
            Read About Our Heritage →
          </Link>
        </div>
      </main>
    );
  }

  // Fallback default
  return (
    <main className="section-container min-h-screen py-12 md:py-20 max-w-4xl mx-auto">
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">Our Story</p>
      <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground mt-3">
        Rooted in Ayurveda. Made for modern rituals.
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
        Dhanvantari Ayurvedic Agencies brings traditional Ayurvedic formulations into everyday life with thoughtful products and dependable quality.
      </p>
      <div className="mt-14 grid gap-8 border-y border-border py-10 md:grid-cols-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Tradition</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Inspired by time-tested Ayurvedic knowledge.</p>
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">Quality</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Made with care and clear product information.</p>
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold">Everyday wellness</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Simple essentials for daily routines.</p>
        </div>
      </div>
      <Link href="/shop" className="mt-10 inline-block text-sm font-semibold text-brand-700">
        Explore the collection →
      </Link>
    </main>
  );
}
