"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Tags } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { createCategory as createCategoryThunk, loadCategories, toggleCategory as toggleCategoryThunk, type Category } from "@/store/adminSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function CategoriesPage() {
  const dispatch = useAppDispatch();
  const { items: categories, isLoading, error: loadError } = useAppSelector((state) => state.admin.categories);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState("");

  useEffect(() => { void dispatch(loadCategories()); }, [dispatch]);

  async function createCategory(event: FormEvent) {
    event.preventDefault(); setError(""); setMessage("");
    const result = await dispatch(createCategoryThunk({ name, description: description || null, sortOrder: categories.length }));
    if (createCategoryThunk.fulfilled.match(result)) { setName(""); setDescription(""); setMessage("Category created successfully."); }
    else setError(result.payload as string ?? "Could not create category.");
  }

  async function toggleCategory(category: Category) {
    setSavingId(category.id); setError("");
    const result = await dispatch(toggleCategoryThunk(category));
    if (toggleCategoryThunk.rejected.match(result)) setError(result.payload as string ?? "Could not update category.");
    setSavingId("");
  }

  return (
    <AdminLayout title="Product Categories" subtitle="Storefront Taxonomy & Navigation">
      <section className="border bg-white rounded-2xl p-6 shadow-xs mb-8">
        <h2 className="text-base font-bold text-slate-900 mb-4">Add New Category</h2>
        <form onSubmit={createCategory} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <input required minLength={2} placeholder="Category name (e.g. Hair Care)" value={name} onChange={(event) => setName(event.target.value)} className="h-10 border rounded-xl px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <input placeholder="Description (optional)" value={description} onChange={(event) => setDescription(event.target.value)} className="h-10 border rounded-xl px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <button className="h-10 bg-emerald-700 hover:bg-emerald-800 px-6 text-xs font-semibold text-white rounded-xl shadow-xs transition-colors">Create Category</button>
        </form>
        {message && <p className="mt-4 text-xs font-semibold text-emerald-700">{message}</p>}
        {error && <p className="mt-4 text-xs font-semibold text-red-600">{error}</p>}
      </section>

      <section className="overflow-x-auto border bg-white rounded-2xl shadow-xs">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b">
            <tr>
              <th className="px-6 py-3.5">Category</th>
              <th className="px-6 py-3.5">Slug Route</th>
              <th className="px-6 py-3.5">Products</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map((category) => (
              <tr key={category.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-900">
                  {category.name.replace("[DEMO] ", "")}
                </td>
                <td className="px-6 py-4">
                  <a
                    href={`http://localhost:3000/categories/${category.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-mono text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded border border-emerald-200 transition-colors"
                  >
                    /categories/{category.slug}
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </td>
                <td className="px-6 py-4 text-xs text-slate-600">
                  {category._count?.products ?? 0} items
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${category.isPublished ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border"}`}>
                    {category.isPublished ? "Published" : "Hidden"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    disabled={savingId === category.id}
                    onClick={() => void toggleCategory(category)}
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                  >
                    {category.isPublished ? "Unpublish" : "Publish"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminLayout>
  );
}
