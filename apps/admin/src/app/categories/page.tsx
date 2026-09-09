"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
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

  return <main className="admin-container"><Link href="/" className="text-sm text-brand-600">Back to dashboard</Link><h1 className="mt-5 text-3xl font-bold">Categories</h1><section className="mt-8 border bg-white p-6"><h2 className="text-xl font-bold">Add category</h2><form onSubmit={createCategory} className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto]"><input required minLength={2} placeholder="Category name" value={name} onChange={(event) => setName(event.target.value)} className="h-10 border px-3 text-sm" /><input placeholder="Description (optional)" value={description} onChange={(event) => setDescription(event.target.value)} className="h-10 border px-3 text-sm" /><button className="h-10 bg-brand-600 px-5 text-sm font-semibold text-white">Create</button></form>{message && <p className="mt-4 text-sm text-brand-600">{message}</p>}{error && <p className="mt-4 text-sm text-red-700">{error}</p>}</section><section className="mt-8 overflow-x-auto border bg-white"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Category</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Products</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y">{categories.map((category) => <tr key={category.id}><td className="px-4 py-4 font-medium">{category.name.replace("[DEMO] ", "")}</td><td className="px-4 py-4 text-slate-500">{category.slug}</td><td className="px-4 py-4">{category._count?.products ?? 0}</td><td className="px-4 py-4 text-brand-600">{category.isPublished ? "Published" : "Hidden"}</td><td className="px-4 py-4"><button type="button" disabled={savingId === category.id} onClick={() => void toggleCategory(category)} className="text-xs font-semibold text-brand-600">{category.isPublished ? "Hide" : "Publish"}</button></td></tr>)}</tbody></table></section></main>;
}
