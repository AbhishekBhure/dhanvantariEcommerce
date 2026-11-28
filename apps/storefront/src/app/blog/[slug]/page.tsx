import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Calendar,
  User,
  Clock,
  Tag,
  Leaf,
  Share2,
  Sparkles,
} from "lucide-react";
import type { BlogPost } from "@dhanvantari/shared-types";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000/api";

interface ArticleProps {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string): Promise<{ post: BlogPost; relatedPosts: BlogPost[] } | null> {
  try {
    const res = await fetch(`${API_URL}/posts/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data: { post: BlogPost; relatedPosts: BlogPost[] };
    };
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ArticleProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPost(slug);
  if (!data) {
    return { title: "Article Not Found | Dhanvantari" };
  }

  const { post } = data;
  return {
    title: post.metaTitle || `${post.title} | Dhanvantari Wellness Journal`,
    description:
      post.metaDescription ||
      post.excerpt ||
      "Classical Ayurvedic wisdom, remedies, and herbal formulations by Dhanvantari Ayurvedic Agencies.",
    openGraph: {
      title: post.metaTitle || post.title,
      description: post.metaDescription || post.excerpt || undefined,
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: ArticleProps) {
  const { slug } = await params;
  const data = await getPost(slug);

  if (!data || !data.post) {
    notFound();
  }

  const { post, relatedPosts } = data;

  return (
    <article className="min-h-screen bg-background py-10 md:py-16">
      <div className="section-container max-w-4xl mx-auto">
        {/* ─── Breadcrumbs ────────────────────────────────────── */}
        <nav aria-label="Breadcrumb" className="mb-8 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-brand-700 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <Link href="/blog" className="hover:text-brand-700 transition-colors">
            Wellness Journal
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          <span className="text-foreground font-medium truncate max-w-xs">{post.title}</span>
        </nav>

        {/* ─── Article Header ─────────────────────────────────── */}
        <header className="mb-10 text-center max-w-3xl mx-auto">
          {post.category && (
            <div className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-brand-700 bg-brand-50 border border-brand-200 px-3.5 py-1 rounded-full mb-4">
              <Tag className="w-3 h-3" />
              <span>{post.category}</span>
            </div>
          )}

          <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-4 text-base md:text-xl text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-foreground">
              <User className="w-4 h-4 text-brand-600" />
              {post.authorName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5 font-mono">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-mono">
              <Clock className="w-3.5 h-3.5" /> 5 min read
            </span>
          </div>
        </header>

        {/* ─── Cover Image ────────────────────────────────────── */}
        {post.coverImage && (
          <div className="relative aspect-[16/9] rounded-3xl overflow-hidden mb-12 shadow-sm bg-muted">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}

        {/* ─── Article Body ───────────────────────────────────── */}
        <div className="prose prose-lg max-w-none text-foreground/90 leading-relaxed space-y-6">
          {post.content.split("\n\n").map((block, idx) => {
            const trimmed = block.trim();
            if (trimmed.startsWith("## ")) {
              return (
                <h2
                  key={idx}
                  className="font-display text-2xl md:text-3xl font-bold text-foreground mt-10 mb-4 border-b border-border pb-2.5"
                >
                  {trimmed.replace("## ", "")}
                </h2>
              );
            }
            if (trimmed.startsWith("### ")) {
              return (
                <h3 key={idx} className="font-display text-xl md:text-2xl font-bold text-foreground mt-8 mb-3">
                  {trimmed.replace("### ", "")}
                </h3>
              );
            }
            if (trimmed.startsWith("> ")) {
              return (
                <blockquote
                  key={idx}
                  className="border-l-4 border-brand-600 pl-4 py-2 italic text-muted-foreground my-6 bg-brand-50/60 rounded-r-xl"
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
                    <li key={itemIdx} className="text-muted-foreground leading-relaxed">
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
                    <li key={itemIdx} className="text-muted-foreground leading-relaxed">
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

        {/* ─── Tags & Author Bio ──────────────────────────────── */}
        <div className="mt-14 pt-8 border-t border-border space-y-8">
          {post.tags && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">Related Topics:</span>
              {post.tags.split(",").map((tag) => (
                <span
                  key={tag.trim()}
                  className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full font-medium"
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}

          {/* Author Card */}
          <div className="p-6 bg-brand-50/80 rounded-2xl border border-brand-100 flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-700 text-white flex items-center justify-center font-bold font-display text-lg flex-shrink-0">
              ध
            </div>
            <div>
              <h4 className="font-bold text-foreground text-sm">{post.authorName}</h4>
              <p className="text-xs text-brand-800 font-medium mt-0.5">Dhanvantari Ayurvedic Agencies</p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                Dedicated to restoring authentic Ayurvedic healing and natural formulations based on the classical Charaka and Sushruta Samhitas.
              </p>
            </div>
          </div>
        </div>

        {/* ─── Shop Callout ───────────────────────────────────── */}
        <div className="mt-12 p-8 bg-gradient-to-r from-brand-900 to-brand-950 text-white rounded-3xl text-center space-y-4 shadow-lg">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gold-500/20 text-gold-300 mx-auto">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-display text-2xl font-bold">Experience Authentic Ayurveda</h3>
          <p className="text-brand-200 text-sm max-w-xl mx-auto leading-relaxed">
            All Dhanvantari products are formulated with the exact botanical preparations mentioned in our clinical guides. A flat ₹50 delivery charge applies to every order across India.
          </p>
          <div className="pt-2">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-bold text-brand-950 bg-gold-400 hover:bg-gold-300 shadow-md transition-all"
            >
              Shop All Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ─── Related Articles ───────────────────────────────── */}
        {relatedPosts && relatedPosts.length > 0 && (
          <section className="mt-16 pt-12 border-t border-border">
            <h3 className="font-display text-2xl font-bold text-foreground mb-6">
              More from the Journal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/blog/${rel.slug}`}
                  className="group bg-white border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                    {rel.coverImage ? (
                      <Image
                        src={rel.coverImage}
                        alt={rel.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center">
                        <Leaf className="w-8 h-8 text-white/30" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <h4 className="font-display font-semibold text-sm text-foreground group-hover:text-brand-700 transition-colors line-clamp-2">
                      {rel.title}
                    </h4>
                    <span className="mt-3 text-xs font-semibold text-brand-700 flex items-center gap-1">
                      Read Article <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
