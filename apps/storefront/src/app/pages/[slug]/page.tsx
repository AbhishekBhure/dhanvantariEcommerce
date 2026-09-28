import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ChevronRight, ArrowLeft, Leaf, Calendar } from "lucide-react";
import type { ContentPage } from "@dhanvantari/shared-types";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000/api";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getPage(slug: string): Promise<ContentPage | null> {
  try {
    const res = await fetch(`${API_URL}/pages/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data: { page: ContentPage } };
    return json.data.page;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) {
    return { title: "Page Not Found | Dhanvantari" };
  }

  return {
    title: page.metaTitle || `${page.title} | Dhanvantari Ayurvedic Agencies`,
    description:
      page.metaDescription ||
      page.excerpt ||
      "Pure Ayurvedic formulations and holistic living with Dhanvantari Ayurvedic Agencies.",
  };
}

export default async function DynamicCMSPage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <article className="min-h-screen bg-background py-12 md:py-20">
      <div className="section-container max-w-4xl mx-auto">
        {/* ─── Breadcrumbs ────────────────────────────────────── */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-brand-700 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <span className="text-foreground font-medium truncate">{page.title}</span>
        </nav>

        {/* ─── Header ─────────────────────────────────────────── */}
        <header className="mb-10 pb-8 border-b border-border">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-brand-700 bg-brand-50 px-3 py-1 rounded-full mb-4">
            <Leaf className="w-3.5 h-3.5 text-brand-600" />
            <span>Dhanvantari Ayurveda</span>
          </div>

          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
            {page.title}
          </h1>

          {page.excerpt && (
            <p className="mt-4 text-lg md:text-xl text-muted-foreground leading-relaxed">
              {page.excerpt}
            </p>
          )}

          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              Last updated:{" "}
              {new Date(page.updatedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </header>

        {/* ─── Featured Image (Optional) ──────────────────────── */}
        {page.featuredImage && (
          <div className="relative aspect-[21/9] rounded-2xl overflow-hidden mb-12 shadow-sm bg-muted">
            <Image
              src={page.featuredImage}
              alt={page.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* ─── Rich Content Body ──────────────────────────────── */}
        <div className="prose prose-lg max-w-none text-foreground/90 leading-relaxed space-y-6">
          {page.content.split("\n\n").map((block, idx) => {
            const trimmed = block.trim();
            if (trimmed.startsWith("## ")) {
              return (
                <h2
                  key={idx}
                  className="font-display text-2xl md:text-3xl font-bold text-foreground mt-8 mb-4 border-b border-border pb-2"
                >
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
                <blockquote
                  key={idx}
                  className="border-l-4 border-brand-600 pl-4 py-1 italic text-muted-foreground my-4 bg-brand-50/50 rounded-r-lg"
                >
                  {trimmed.replace("> ", "")}
                </blockquote>
              );
            }
            if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
              const items = trimmed.split("\n").map((line) => line.replace(/^[*\-]\s+/, ""));
              return (
                <ul key={idx} className="list-disc pl-6 space-y-2 my-4">
                  {items.map((it, itemIdx) => (
                    <li key={itemIdx} className="text-muted-foreground">
                      {it}
                    </li>
                  ))}
                </ul>
              );
            }
            if (/^\d+\.\s/.test(trimmed)) {
              const items = trimmed.split("\n").map((line) => line.replace(/^\d+\.\s+/, ""));
              return (
                <ol key={idx} className="list-decimal pl-6 space-y-2 my-4">
                  {items.map((it, itemIdx) => (
                    <li key={itemIdx} className="text-muted-foreground">
                      {it}
                    </li>
                  ))}
                </ol>
              );
            }
            return (
              <p key={idx} className="text-base md:text-lg leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {trimmed}
              </p>
            );
          })}
        </div>

        {/* ─── Footer Action ──────────────────────────────────── */}
        <div className="mt-16 pt-8 border-t border-border flex items-center justify-between">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Explore Pure Ayurvedic Remedies
          </Link>
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </article>
  );
}
