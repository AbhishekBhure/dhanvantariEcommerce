"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, ExternalLink, Edit, Trash2, FileText, CheckCircle2, Clock } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadPages, deletePage } from "@/store/adminSlice";

export default function PagesListPage() {
  const dispatch = useAppDispatch();
  const { items: pages, isLoading, error } = useAppSelector((state) => state.admin.pages);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    void dispatch(loadPages());
  }, [dispatch]);

  async function handleDelete(id: string, title: string) {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    await dispatch(deletePage(id));
  }

  const filteredPages = pages.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout
      title="Storefront Pages"
      subtitle="Content Management System"
      actions={
        <Link
          href="/cms/pages/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add New Page
        </Link>
      }
    >
      {/* Search and stats bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search pages by title or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-500">
          Showing <strong>{filteredPages.length}</strong> pages
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {/* Pages Table Card */}
      <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
        {isLoading && pages.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading pages...</div>
        ) : filteredPages.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">No pages found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create your first dynamic page with a custom [slug] to start building content for your storefront.
            </p>
            <Link
              href="/cms/pages/new"
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100"
            >
              <Plus className="w-3.5 h-3.5" /> Create Page
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b">
                <tr>
                  <th className="px-6 py-3.5">Title</th>
                  <th className="px-6 py-3.5">Slug Route</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Last Updated</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPages.map((page) => (
                  <tr key={page.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/cms/pages/${page.id}`}
                        className="font-semibold text-slate-900 hover:text-emerald-700 transition-colors block"
                      >
                        {page.title}
                      </Link>
                      {page.excerpt && (
                        <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{page.excerpt}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`http://localhost:3000/pages/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded border border-emerald-200 transition-colors"
                      >
                        /pages/{page.slug}
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      {page.isPublished ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Published
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border">
                          <Clock className="w-3 h-3" /> Draft
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(page.updatedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/cms/pages/${page.id}`}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Edit Page"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(page.id, page.title)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Page"
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
