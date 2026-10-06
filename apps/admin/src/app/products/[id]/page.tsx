"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { ArrowDown, ArrowUp, ImagePlus, Trash2 } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { api, ApiError } from "@/lib/api";
import { adjustInventory, loadCategories, updateProduct, type Category } from "@/store/adminSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

type ProductDetail = { id: string; name: string; slug: string; sku: string | null; description: string | null; shortDescription: string | null; ingredients: string | null; usageInstructions: string | null; mrp: number; price: number; stock: number; isPublished: boolean; isFeatured: boolean; isBestseller: boolean; isNew: boolean; images: Array<{ id: string; url: string; altText: string | null; sortOrder: number }>; categories: Array<{ category: Category }> };

export default function ProductEditPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.admin.categories.items);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [stockDelta, setStockDelta] = useState("");
  const [stockReason, setStockReason] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void dispatch(loadCategories());
    void api<{ data: { product: ProductDetail } }>(`/admin/products/${id}`).then((response) => { setProduct(response.data.product); setImageUrls(response.data.product.images.map((image) => image.url)); }).catch((requestError) => setError(requestError instanceof ApiError ? requestError.message : "Could not load product."));
  }, [dispatch, id]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!product) return; setSaving(true); setError(""); setMessage("");
    try {
      const categoryIds = Array.from((event.currentTarget.elements.namedItem("categoryIds") as HTMLSelectElement).selectedOptions).map((option) => option.value);
      const result = await dispatch(updateProduct({ id, data: { name: product.name, sku: product.sku || null, description: product.description, shortDescription: product.shortDescription, ingredients: product.ingredients, usageInstructions: product.usageInstructions, mrp: Number(product.mrp), price: Number(product.price), isPublished: product.isPublished, isFeatured: product.isFeatured, isBestseller: product.isBestseller, isNew: product.isNew, categoryIds } }));
      if (updateProduct.rejected.match(result)) throw new Error(result.payload as string);
      const images = imageUrls.map((url) => ({ url, altText: product.name }));
      await api(`/admin/products/${id}/images`, { method: "PUT", body: JSON.stringify({ images }) });
      setMessage("Product and image gallery saved.");
    } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : requestError instanceof Error ? requestError.message : "Could not save product."); }
    finally { setSaving(false); }
  }

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true); setError(""); setMessage("");
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append("image", file);
        const response = await api<{ data: { url: string } }>(`/admin/products/${id}/images/upload`, { method: "POST", body: formData });
        setImageUrls((current) => [...current, response.data.url]);
      }
      setMessage("Image upload complete. Save the product to publish the gallery order.");
    } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "Image upload failed. Check the configured Supabase bucket."); }
    finally { setUploading(false); }
  }

  function moveImage(index: number, direction: -1 | 1) {
    setImageUrls((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current]; [next[index], next[target]] = [next[target]!, next[index]!]; return next;
    });
  }

  async function saveInventory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!product) return;
    const result = await dispatch(adjustInventory({ id, quantity: Number(stockDelta), reason: stockReason }));
    if (adjustInventory.fulfilled.match(result)) { setProduct({ ...product, stock: product.stock + Number(stockDelta) }); setStockDelta(""); setStockReason(""); setMessage("Inventory adjustment recorded."); }
    else setError(result.payload as string ?? "Could not adjust inventory.");
  }

  if (!product) return <AdminLayout title="Edit product"><p className="text-sm text-slate-500">{error || "Loading product..."}</p></AdminLayout>;

  return <AdminLayout title="Edit product" subtitle="Catalog management" actions={<Link href="/products" className="text-sm font-semibold text-emerald-700">Back to products</Link>}>
    <form onSubmit={save} className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <section className="grid gap-4 border bg-white p-5 sm:grid-cols-2"><label className="text-sm font-medium sm:col-span-2">Product name<input required minLength={2} value={product.name} onChange={(event) => setProduct({ ...product, name: event.target.value })} className="mt-1 h-10 w-full border px-3" /></label><label className="text-sm font-medium">SKU<input value={product.sku ?? ""} onChange={(event) => setProduct({ ...product, sku: event.target.value || null })} className="mt-1 h-10 w-full border px-3" /></label><label className="text-sm font-medium">Category<select name="categoryIds" multiple defaultValue={product.categories.map(({ category }) => category.id)} className="mt-1 h-24 w-full border px-3">{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="text-sm font-medium">MRP<input type="number" min="0.01" step="0.01" value={product.mrp} onChange={(event) => setProduct({ ...product, mrp: Number(event.target.value) })} className="mt-1 h-10 w-full border px-3" /></label><label className="text-sm font-medium">Selling price<input type="number" min="0.01" step="0.01" value={product.price} onChange={(event) => setProduct({ ...product, price: Number(event.target.value) })} className="mt-1 h-10 w-full border px-3" /></label><label className="text-sm font-medium sm:col-span-2">Short description<textarea rows={2} value={product.shortDescription ?? ""} onChange={(event) => setProduct({ ...product, shortDescription: event.target.value })} className="mt-1 w-full border p-3" /></label><label className="text-sm font-medium sm:col-span-2">Description<textarea rows={5} value={product.description ?? ""} onChange={(event) => setProduct({ ...product, description: event.target.value })} className="mt-1 w-full border p-3" /></label><label className="text-sm font-medium">Ingredients<textarea rows={4} value={product.ingredients ?? ""} onChange={(event) => setProduct({ ...product, ingredients: event.target.value })} className="mt-1 w-full border p-3" /></label><label className="text-sm font-medium">Usage instructions<textarea rows={4} value={product.usageInstructions ?? ""} onChange={(event) => setProduct({ ...product, usageInstructions: event.target.value })} className="mt-1 w-full border p-3" /></label><div className="flex flex-wrap gap-5 sm:col-span-2">{(["isPublished", "isFeatured", "isBestseller", "isNew"] as const).map((key) => <label key={key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={product[key]} onChange={(event) => setProduct({ ...product, [key]: event.target.checked })} />{key.replace("is", "").replace(/([A-Z])/g, " $1")}</label>)}</div></section>
        <section className="border bg-white p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold">Product image gallery</h2><p className="mt-1 text-xs text-slate-500">Upload JPG, PNG, WebP, or AVIF images. The first image is the primary product image.</p></div><label className="inline-flex h-10 cursor-pointer items-center gap-2 bg-emerald-700 px-4 text-sm font-semibold text-white"><ImagePlus className="h-4 w-4"/>{uploading ? "Uploading..." : "Upload images"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={uploading || imageUrls.length >= 20} onChange={(event) => { void uploadImages(event.target.files); event.currentTarget.value = ""; }} className="sr-only"/></label></div><p className="mt-2 text-xs text-slate-500">{imageUrls.length} / 20 images</p>{imageUrls.length > 0 ? <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{imageUrls.map((url, index) => <li key={`${url}-${index}`} className="overflow-hidden border"><div className="relative aspect-square bg-slate-100"><Image src={url} alt={`${product.name} image ${index + 1}`} fill unoptimized className="object-contain"/><span className="absolute left-2 top-2 bg-white/90 px-2 py-1 text-xs font-semibold">{index === 0 ? "Primary" : `Image ${index + 1}`}</span></div><div className="flex items-center justify-end gap-2 border-t p-2"><button type="button" disabled={index === 0} onClick={() => moveImage(index, -1)} aria-label="Move image earlier" className="grid h-8 w-8 place-items-center border disabled:opacity-40"><ArrowUp className="h-4 w-4"/></button><button type="button" disabled={index === imageUrls.length - 1} onClick={() => moveImage(index, 1)} aria-label="Move image later" className="grid h-8 w-8 place-items-center border disabled:opacity-40"><ArrowDown className="h-4 w-4"/></button><button type="button" onClick={() => setImageUrls((current) => current.filter((_, imageIndex) => imageIndex !== index))} aria-label="Remove image" className="grid h-8 w-8 place-items-center border text-red-700"><Trash2 className="h-4 w-4"/></button></div></li>)}</ol> : <div className="mt-4 border border-dashed p-8 text-center text-sm text-slate-500">No product images uploaded yet.</div>}</section>
      </div>
      <aside className="h-fit space-y-5"><section className="border bg-white p-5"><h2 className="font-semibold">Inventory adjustment</h2><p className="mt-2 text-sm text-slate-600">Available: <strong>{product.stock}</strong></p><form onSubmit={saveInventory} className="mt-4 space-y-3"><label className="block text-sm">Change quantity<input type="number" required value={stockDelta} onChange={(event) => setStockDelta(event.target.value)} className="mt-1 h-10 w-full border px-3" placeholder="e.g. 12 or -2" /></label><label className="block text-sm">Reason<input required minLength={3} value={stockReason} onChange={(event) => setStockReason(event.target.value)} className="mt-1 h-10 w-full border px-3" /></label><button className="h-10 w-full border border-emerald-700 text-sm font-semibold text-emerald-800">Record adjustment</button></form></section><button disabled={saving} className="h-11 w-full bg-emerald-700 text-sm font-semibold text-white disabled:opacity-50">{saving ? "Saving..." : "Save product"}</button>{message && <p role="status" className="text-sm text-emerald-700">{message}</p>}{error && <p role="alert" className="text-sm text-red-700">{error}</p>}</aside>
    </form>
  </AdminLayout>;
}
