"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { createProduct as createProductThunk, deleteProduct, loadCategories, loadProducts, toggleProduct, type Product } from "@/store/adminSlice";
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
  const [productsError, setProductsError] = useState("");
  const [updatingProductId, setUpdatingProductId] = useState("");
  const [deletingProductId, setDeletingProductId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => { const timer = window.setTimeout(() => void dispatch(loadProducts({ page, pageSize: 20, search: search.trim() || undefined })), 250); return () => window.clearTimeout(timer); }, [dispatch, page, search]);
  useEffect(() => { void dispatch(loadCategories()); }, [dispatch]);
  useEffect(() => { const firstCategoryId = categories[0]?.id; if (!form.categoryId && firstCategoryId) setForm((current) => ({ ...current, categoryId: firstCategoryId })); }, [categories, form.categoryId]);

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); setIsSaving(true);
    try {
      const result = await dispatch(createProductThunk({ name: form.name, shortDescription: form.shortDescription || null, mrp: Number(form.mrp), price: Number(form.price), stock: Number(form.stock), categoryIds: [form.categoryId], isPublished: form.isPublished, isFeatured: false, isBestseller: false, isNew: true, variants: [] }));
      if (createProductThunk.fulfilled.match(result)) { setForm({ ...initialForm, categoryId: categories[0]?.id || "" }); setMessage("Product created successfully."); }
      else setError(result.payload as string ?? "Could not create product.");
    } finally { setIsSaving(false); }
  }

  async function refreshProducts() {
    const result = await dispatch(loadProducts({ page, pageSize: 20, search: search.trim() || undefined }));
    if (loadProducts.rejected.match(result)) {
      setProductsError(result.payload as string ?? "Could not refresh products.");
    }
  }

  async function handleToggleProduct(product: Product) {
    setProductsError("");
    setUpdatingProductId(product.id);
    const result = await dispatch(toggleProduct(product));
    if (toggleProduct.rejected.match(result)) {
      setProductsError(result.payload as string ?? "Could not update product status.");
    } else {
      await refreshProducts();
    }
    setUpdatingProductId("");
  }

  async function handleDeleteProduct(product: Product) {
    if (product.orderCount > 0) return;
    if (!window.confirm(`Permanently delete "${product.name}"? This removes the product and its associated catalog data. Products with past orders cannot be deleted.`)) return;

    setProductsError("");
    setDeletingProductId(product.id);
    const result = await dispatch(deleteProduct(product));
    if (deleteProduct.rejected.match(result)) {
      setProductsError(result.payload as string ?? "Could not permanently delete product.");
    } else if (products.length === 1 && page > 1) {
      setPage((current) => Math.max(1, current - 1));
    } else {
      await refreshProducts();
    }
    setDeletingProductId("");
  }

  return (
    <AdminLayout title="Product Catalog" subtitle="Inventory & Merchandising">
      {/* Add Product Form Card */}
      <section className="border bg-white rounded-2xl p-6 shadow-xs mb-8">
        <h2 className="text-base font-bold text-slate-900 mb-4">Add New Ayurvedic Product</h2>
        <form onSubmit={createProduct} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="lg:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Product Name</span>
            <input required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="h-10 w-full border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="e.g. Pure Bhringraj Scalp Oil" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-slate-600">MRP (₹)</span>
            <input required type="number" min="1" value={form.mrp} onChange={(event) => setForm({ ...form, mrp: event.target.value })} className="h-10 w-full border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="599" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-slate-600">Selling Price (₹)</span>
            <input required type="number" min="1" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="h-10 w-full border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="499" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-slate-600">Initial Stock</span>
            <input required type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} className="h-10 w-full border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="50" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-semibold text-slate-600">Category</span>
            <select required value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })} className="h-10 w-full border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">Select category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name.replace("[DEMO] ", "")}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 pt-6 text-xs font-semibold text-slate-700">
            <input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} className="rounded text-emerald-600 focus:ring-emerald-500" /> Publish on storefront
          </label>
          <label className="sm:col-span-2 lg:col-span-4">
            <span className="mb-1 block text-xs font-semibold text-slate-600">Short Description <span className="font-normal text-slate-400">(optional)</span></span>
            <input value={form.shortDescription} onChange={(event) => setForm({ ...form, shortDescription: event.target.value })} className="h-10 w-full border rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Brief therapeutic benefit..." />
          </label>
          <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
            <button disabled={isSaving || !form.categoryId} className="h-10 bg-emerald-700 hover:bg-emerald-800 px-6 text-xs font-semibold text-white rounded-xl shadow-xs disabled:opacity-60 transition-colors">
              {isSaving ? "Saving..." : "Create Product"}
            </button>
          </div>
        </form>
        {message && <p className="mt-4 text-xs font-semibold text-emerald-700">{message}</p>}
        {error && <p className="mt-4 text-xs font-semibold text-red-600">{error}</p>}
      </section>

      <div className="mb-4 flex gap-3"><input aria-label="Search products" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search product name or SKU" className="h-10 w-full max-w-md border bg-white px-3 text-sm" /><span className="self-center text-xs text-slate-500">Page {page} · {products.length} results</span></div>
      {/* Products Table Card */}
      <section className="overflow-x-auto border bg-white rounded-2xl shadow-xs">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b">
            <tr>
              <th className="px-6 py-3.5">Product Name</th>
              <th className="px-6 py-3.5">Category</th>
              <th className="px-6 py-3.5">Price</th>
              <th className="px-6 py-3.5">Stock</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 font-semibold text-slate-900">
                  {product.name.replace("[DEMO] ", "")}
                </td>
                <td className="px-6 py-4 text-xs text-slate-600">
                  {product.categories.join(", ") || "General"}
                </td>
                <td className="px-6 py-4 font-mono font-medium text-slate-800">
                  ₹{product.price}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-0.5 rounded font-mono ${product.stock <= 5 ? "bg-amber-50 text-amber-700 border border-amber-200" : "text-slate-700"}`}>
                    {product.stock} in stock
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${product.isPublished ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-600 border"}`}>
                    {product.isPublished ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/products/${product.id}`} aria-label={`Edit ${product.name}`} className="inline-flex items-center gap-2 whitespace-nowrap text-xs font-semibold text-emerald-700">
                      <Pencil className="h-4 w-4" />Edit
                    </Link>
                    <button
                      type="button"
                      disabled={updatingProductId === product.id || deletingProductId === product.id}
                      onClick={() => void handleToggleProduct(product)}
                      className="whitespace-nowrap text-xs font-semibold text-emerald-700 hover:underline disabled:opacity-50"
                    >
                      {product.isPublished ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      disabled={product.orderCount > 0 || updatingProductId === product.id || deletingProductId === product.id}
                      title={product.orderCount > 0 ? "Products with past orders cannot be deleted. Deactivate instead." : undefined}
                      onClick={() => void handleDeleteProduct(product)}
                      className="whitespace-nowrap text-xs font-semibold text-red-700 hover:underline disabled:opacity-50"
                    >
                      {deletingProductId === product.id ? "Deleting..." : product.orderCount > 0 ? "Has orders" : "Delete permanently"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {productsError && <p role="alert" className="px-6 py-4 text-xs font-semibold text-red-600">{productsError}</p>}
      </section>
      <div className="mt-4 flex justify-end gap-2"><button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="h-9 border bg-white px-3 text-sm disabled:opacity-40">Previous</button><button type="button" disabled={products.length < 20} onClick={() => setPage((current) => current + 1)} className="h-9 border bg-white px-3 text-sm disabled:opacity-40">Next</button></div>
    </AdminLayout>
  );
}
