"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, ExternalLink, Edit, Trash2, Newspaper, CheckCircle2, Clock, Tag } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadPosts, deletePost } from "@/store/adminSlice";

export default function BlogPostsListPage() {
  const dispatch = useAppDispatch();
  const { items: posts, isLoading, error } = useAppSelector((state) => state.admin.posts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  useEffect(() => {
    void dispatch(loadPosts());
  }, [dispatch]);

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    await dispatch(deletePost(id));
  }

  const categories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean)));

  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.authorName && p.authorName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AdminLayout
      title="Wellness Journal & Blog Posts"
      subtitle="Content Management System"
      actions={
        <Link
          href="/cms/posts/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Write New Article
        </Link>
      }
    >
      {/* Search and Filters */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative min-w-[240px] max-w-md flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search articles by title, author, or slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c as string} value={c as string}>
                {c as string}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <strong>{filteredPosts.length}</strong> articles
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* Articles Table Card */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        {isLoading && posts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading articles...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-12 text-center">
            <Newspaper className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No articles found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Share Ayurvedic insights, dosha lifestyle rituals, and remedy guides to engage customers and drive organic search.
            </p>
            <Link
              href="/cms/posts/new"
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100"
            >
              <Plus className="w-3.5 h-3.5" /> Write First Article
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b">
                <tr>
                  <th className="px-6 py-3.5">Article</th>
                  <th className="px-6 py-3.5">Slug Route</th>
                  <th className="px-6 py-3.5">Category</th>
                  <th className="px-6 py-3.5">Author</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {post.coverImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={post.coverImage}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover border flex-shrink-0 bg-slate-100"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                            <Newspaper className="w-5 h-5 opacity-60" />
                          </div>
                        )}
                        <div>
                          <Link
                            href={`/cms/posts/${post.id}`}
                            className="font-semibold text-slate-900 hover:text-emerald-700 transition-colors block"
                          >
                            {post.title}
                          </Link>
                          {post.excerpt && (
                            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5 max-w-md">{post.excerpt}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`http://localhost:3000/blog/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded border border-emerald-200 transition-colors"
                      >
                        /blog/{post.slug}
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      {post.category ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                          <Tag className="w-3 h-3 text-slate-400" />
                          {post.category}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {post.authorName}
                    </td>
                    <td className="px-6 py-4">
                      {post.isPublished ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border">
                          <Clock className="w-3 h-3" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/cms/posts/${post.id}`}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Edit Article"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(post.id, post.title)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Article"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
