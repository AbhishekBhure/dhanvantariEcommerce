import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Calendar, User, Clock, ArrowRight, Tag, BookOpen, Leaf } from "lucide-react";
import type { BlogPost } from "@dhanvantari/shared-types";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000/api";

export const metadata: Metadata = {
  title: "Ayurvedic Wellness Journal & Remedies | Dhanvantari",
  description:
    "Explore classical Ayurvedic remedies, dosha-balancing guides, scalp rituals, and holistic herbal lifestyle articles by Dhanvantari Vaidyas.",
};

interface BlogIndexProps {
  searchParams: Promise<{ category?: string; search?: string }>;
}

async function getPosts(category?: string, search?: string) {
  try {
    const params = new URLSearchParams();
    if (category && category !== "ALL") params.set("category", category);
    if (search) params.set("search", search);

    const res = await fetch(`${API_URL}/posts?${params.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return { posts: [], categories: [] };
    const json = (await res.json()) as {
      data: { posts: BlogPost[]; categories: string[]; total: number };
    };
    return json.data;
  } catch {
    return { posts: [], categories: [] };
  }
}

export default async function BlogIndexPage({ searchParams }: BlogIndexProps) {
  const { category, search } = await searchParams;
  const { posts, categories } = await getPosts(category, search);

  const featuredPost = posts[0];
  const remainingPosts = posts.slice(1);

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Hero Header ───────────────────────────────────────── */}
      <section className="bg-brand-950 text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_70%_30%,rgba(212,175,55,0.4)_0%,transparent_60%)]" />
        <div className="section-container relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gold-500/20 text-gold-300 border border-gold-500/30 rounded-full px-4 py-1.5 text-xs font-medium mb-6">
            <Leaf className="w-3.5 h-3.5" />
            <span>Vedic Wellness Journal</span>
          </div>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Timeless Ayurvedic Wisdom
            <br />
            <span className="text-gold-400">For Modern Living</span>
          </h1>

          <p className="text-brand-200 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Authentic herbal remedies, dosha guides, seasonal dinacharya, and therapeutic hair & skincare rituals crafted by our experienced Vaidyas.
          </p>
        </div>
      </section>

      {/* ─── Category Filter Pills ─────────────────────────────── */}
      <section className="border-b border-border bg-white sticky top-16 z-30">
        <div className="section-container py-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <Link
              href="/blog"
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                !category || category === "ALL"
                  ? "bg-brand-700 text-white"
                  : "bg-muted text-muted-foreground hover:bg-slate-200 hover:text-foreground"
              }`}
            >
              All Articles
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/blog?category=${encodeURIComponent(cat)}`}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  category === cat
                    ? "bg-brand-700 text-white"
                    : "bg-muted text-muted-foreground hover:bg-slate-200 hover:text-foreground"
                }`}
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Main Content Area ─────────────────────────────────── */}
      <main className="section-container py-12 md:py-16">
        {posts.length === 0 ? (
          <div className="py-20 text-center max-w-md mx-auto">
            <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground">No articles published yet</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Our Vaidyas are preparing authentic Ayurvedic remedies and guides. Check back soon!
            </p>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:underline"
            >
              Explore Products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Featured Article Hero Card */}
            {featuredPost && (
              <div className="group relative bg-white border border-border rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-shadow">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                  <div className="lg:col-span-7 relative min-h-[300px] lg:min-h-[440px] bg-muted overflow-hidden">
                    {featuredPost.coverImage ? (
                      <Image
                        src={featuredPost.coverImage}
                        alt={featuredPost.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        priority
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center">
                        <Leaf className="w-16 h-16 text-white/30" />
                      </div>
                    )}
                    {featuredPost.category && (
                      <div className="absolute top-4 left-4">
                        <span className="bg-brand-950/80 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/20">
                          {featuredPost.category}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-brand-600" />
                          {featuredPost.authorName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(featuredPost.publishedAt || featuredPost.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground group-hover:text-brand-700 transition-colors leading-tight">
                        <Link href={`/blog/${featuredPost.slug}`}>
                          {featuredPost.title}
                        </Link>
                      </h2>

                      {featuredPost.excerpt && (
                        <p className="mt-4 text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-3">
                          {featuredPost.excerpt}
                        </p>
                      )}
                    </div>

                    <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                      <Link
                        href={`/blog/${featuredPost.slug}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 group-hover:text-brand-900"
                      >
                        Read Full Article <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> 4 min read
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Articles Grid */}
            {remainingPosts.length > 0 && (
              <div>
                <h3 className="font-display text-2xl font-bold text-foreground mb-6">
                  Recent Articles
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {remainingPosts.map((post) => (
                    <article
                      key={post.id}
                      className="group bg-white border border-border rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Thumbnail */}
                        <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                          {post.coverImage ? (
                            <Image
                              src={post.coverImage}
                              alt={post.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center">
                              <Leaf className="w-10 h-10 text-white/30" />
                            </div>
                          )}
                          {post.category && (
                            <div className="absolute top-3 left-3">
                              <span className="bg-brand-950/80 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-white/20">
                                {post.category}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Text Details */}
                        <div className="p-6">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2.5 font-mono">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>
                              {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          </div>

                          <h4 className="font-display font-bold text-lg text-foreground group-hover:text-brand-700 transition-colors line-clamp-2 leading-snug">
                            <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                          </h4>

                          {post.excerpt && (
                            <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {post.excerpt}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="px-6 pb-6 pt-3 border-t border-border flex items-center justify-between text-xs">
                        <Link
                          href={`/blog/${post.slug}`}
                          className="font-semibold text-brand-700 hover:underline inline-flex items-center gap-1"
                        >
                          Read Article <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <span className="text-muted-foreground">{post.authorName}</span>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
