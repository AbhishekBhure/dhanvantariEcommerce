"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createProduct as createProductThunk, loadCategories, loadProducts, type Category, type Product } from "@/store/adminSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const initialForm = { name: "", shortDescription: "", mrp: "", price: "", stock: "", categoryId: "", isPublished: false };

export default function ProductsPage() {
  const dispatch = useAppDispatch();
  const products = useAppSelector((state) => state.admin.products.items);
  const categories = useAppSelector((state) => state.admin.categories.items.filter((category) => category.isPublished));
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { void dispatch(loadProducts()); void dispatch(loadCategories()); }, [dispatch]);
  useEffect(() => { const firstCategoryId = categories[0]?.id; if (!form.categoryId && firstCategoryId) setForm((current) => ({ ...current, categoryId: firstCategoryId })); }, [categories, form.categoryId]);

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); setIsSaving(true);
    try {
      const result = await dispatch(createProductThunk({ name: form.name, shortDescription: form.shortDescription || null, mrp: Number(form.mrp), price: Number(form.price), stock: Number(form.stock), categoryIds: [form.categoryId], isPublished: form.isPublished, isFeatured: false, isBestseller: false, isNew: true, variants: [] }));
      if (createProductThunk.fulfilled.match(result)) { setForm({ ...initialForm, categoryId: categories[0]?.id || "" }); setMessage("Product created successfully."); }
      else setError(result.payload as string ?? "Could not create product.");
    } finally { setIsSaving(false); }
  }

  return <main className="admin-container"><Link href="/" className="text-sm text-brand-600">Back to dashboard</Link><h1 className="mt-5 text-3xl font-bold">Products</h1><section className="mt-8 border bg-white p-6"><h2 className="text-xl font-bold">Add product</h2><form onSubmit={createProduct} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><label className="lg:col-span-2"><span className="mb-1 block text-sm font-medium">Product name</span><input required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-10 w-full border px-3 text-sm" /></label><label><span className="mb-1 block text-sm font-medium">MRP</span><input required type="number" min="1" value={form.mrp} onChange={(event) => setForm({ ...form, mrp: event.target.value })} className="h-10 w-full border px-3 text-sm" /></label><label><span className="mb-1 block text-sm font-medium">Selling price</span><input required type="number" min="1" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="h-10 w-full border px-3 text-sm" /></label><label><span className="mb-1 block text-sm font-medium">Stock</span><input required type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} className="h-10 w-full border px-3 text-sm" /></label><label><span className="mb-1 block text-sm font-medium">Category</span><select required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} className="h-10 w-full border px-3 text-sm"><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name.replace("[DEMO] ", "")}</option>)}</select></label><label className="flex items-center gap-2 pt-6 text-sm"><input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} /> Publish now</label><label className="sm:col-span-2 lg:col-span-4"><span className="mb-1 block text-sm font-medium">Short description <span className="font-normal text-slate-500">(optional)</span></span><input value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} className="h-10 w-full border px-3 text-sm" /></label><button disabled={isSaving || !form.categoryId} className="h-10 bg-brand-600 px-5 text-sm font-semibold text-white disabled:opacity-60">{isSaving ? "Saving..." : "Create product"}</button></form>{message && <p className="mt-4 text-sm text-brand-600">{message}</p>}{error && <p className="mt-4 text-sm text-red-700">{error}</p>}</section><section className="mt-8 overflow-x-auto border bg-white"><table className="w-full min-w-[640px] text-left text-sm"><thead className="border-b text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y">{products.map((product) => <tr key={product.id}><td className="px-4 py-4 font-medium">{product.name.replace("[DEMO] ", "")}</td><td className="px-4 py-4">{product.categories.join(", ")}</td><td className="px-4 py-4">₹{product.price}</td><td className="px-4 py-4">{product.stock}</td><td className="px-4 py-4 text-brand-600">{product.isPublished ? "Published" : "Draft"}</td></tr>)}</tbody></table></section></main>;
}
