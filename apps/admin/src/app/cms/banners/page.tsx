"use client";

import React, { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Image as ImageIcon, ArrowRight, CheckCircle2, Eye, EyeOff, Save, X } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadBanners, createBanner, updateBanner, deleteBanner, Banner } from "@/store/adminSlice";

export default function BannersManagerPage() {
  const dispatch = useAppDispatch();
  const { items: banners, isLoading, error } = useAppSelector((state) => state.admin.banners);
  const mutation = useAppSelector((state) => state.admin.mutation);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [mobileImageUrl, setMobileImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("/shop");
  const [linkText, setLinkText] = useState("Shop Now");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    void dispatch(loadBanners());
  }, [dispatch]);

  function openCreateModal() {
    setEditingBanner(null);
    setTitle("");
    setSubtitle("");
    setImageUrl("");
    setMobileImageUrl("");
    setLinkUrl("/shop");
    setLinkText("Shop Now");
    setSortOrder(banners.length);
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  }

  function openEditModal(banner: Banner) {
    setEditingBanner(banner);
    setTitle(banner.title);
    setSubtitle(banner.subtitle ?? "");
    setImageUrl(banner.imageUrl);
    setMobileImageUrl(banner.mobileImageUrl ?? "");
    setLinkUrl(banner.linkUrl ?? "/shop");
    setLinkText(banner.linkText ?? "Shop Now");
    setSortOrder(banner.sortOrder);
    setIsActive(banner.isActive);
    setFormError(null);
    setIsModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError("Banner title is required.");
      return;
    }
    if (!imageUrl.trim()) {
      setFormError("Banner image URL is required.");
      return;
    }

    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      imageUrl: imageUrl.trim(),
      mobileImageUrl: mobileImageUrl.trim() || null,
      linkUrl: linkUrl.trim() || null,
      linkText: linkText.trim() || null,
      sortOrder: Number(sortOrder),
      isActive,
    };

    try {
      if (editingBanner) {
        await dispatch(updateBanner({ id: editingBanner.id, data: payload })).unwrap();
      } else {
        await dispatch(createBanner(payload)).unwrap();
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(typeof err === "string" ? err : "Failed to save banner.");
    }
  }

  async function handleToggleActive(banner: Banner) {
    await dispatch(updateBanner({ id: banner.id, data: { isActive: !banner.isActive } }));
  }

  async function handleDelete(id: string, bannerTitle: string) {
    if (!window.confirm(`Delete banner "${bannerTitle}"?`)) return;
    await dispatch(deleteBanner(id));
  }

  return (
    <AdminLayout
      title="Hero Banners & Promotions"
      subtitle="Storefront Merchandising"
      actions={
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> Add New Banner
        </button>
      }
    >
      <div className="mb-6 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Manage your storefront hero slider, promotional offers, and call-to-actions.
        </p>
        <div className="text-xs text-slate-500">
          <strong>{banners.length}</strong> banners configured
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {isLoading && banners.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading banners...</div>
      ) : banners.length === 0 ? (
        <div className="bg-white border rounded-2xl p-12 text-center shadow-sm">
          <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-700">No banners created yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Create hero slides to highlight Ayurvedic remedies, new product launches, or seasonal wellness promotions.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100"
          >
            <Plus className="w-3.5 h-3.5" /> Add First Banner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all ${
                !banner.isActive ? "opacity-60 border-slate-200" : "border-slate-300"
              }`}
            >
              {/* Image Hero Preview */}
              <div className="relative aspect-[21/9] bg-slate-900 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/20 backdrop-blur-sm">
                      Order: {banner.sortOrder}
                    </span>
                    {banner.isActive ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/90 text-white flex items-center gap-1">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Live
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-500/80 text-white">
                        Inactive
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-base md:text-lg leading-tight line-clamp-1">
                    {banner.title}
                  </h3>
                  {banner.subtitle && (
                    <p className="text-xs text-white/80 line-clamp-1 mt-0.5">{banner.subtitle}</p>
                  )}
                </div>
              </div>

              {/* Banner Details & Controls */}
              <div className="p-4 flex items-center justify-between border-t gap-3 bg-white">
                <div className="text-xs truncate">
                  <span className="text-slate-400">CTA: </span>
                  <span className="font-semibold text-slate-800">{banner.linkText || "Shop Now"}</span>
                  <span className="text-slate-400 mx-1.5">→</span>
                  <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    {banner.linkUrl || "/shop"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(banner)}
                    className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      banner.isActive
                        ? "text-slate-600 hover:bg-slate-100"
                        : "text-emerald-700 bg-emerald-50 border-emerald-200"
                    }`}
                    title={banner.isActive ? "Deactivate" : "Activate"}
                  >
                    {banner.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(banner)}
                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border"
                    title="Edit Banner"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(banner.id, banner.title)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border"
                    title="Delete Banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Banner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b mb-5">
              <h3 className="text-lg font-bold text-slate-900">
                {editingBanner ? "Edit Banner" : "Create New Banner"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <p className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                {formError}
              </p>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Headline Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Pure Ayurveda. Modern Living."
                  className="w-full text-sm px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Subtitle / Supporting Text</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Discover time-tested Ayurvedic formulations crafted for your daily rituals."
                  className="w-full text-sm px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Desktop Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full text-sm px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
                {imageUrl && (
                  <div className="mt-2 relative aspect-[21/9] rounded-lg overflow-hidden border bg-slate-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Image URL (Optional)</label>
                <input
                  type="url"
                  value={mobileImageUrl}
                  onChange={(e) => setMobileImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/... (vertical/square crop for phones)"
                  className="w-full text-sm px-3.5 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="Shop Now"
                    className="w-full text-sm px-3.5 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Button Target Link</label>
                  <input
                    type="text"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="/shop or /categories/hair-care"
                    className="w-full text-sm px-3.5 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    min={0}
                    className="w-full text-sm px-3.5 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-5">
                  <input
                    type="checkbox"
                    id="banner-is-active"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="banner-is-active" className="text-xs font-semibold text-slate-700">
                    Active on Storefront
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mutation.isLoading}
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-sm disabled:opacity-50"
                >
                  {mutation.isLoading ? "Saving..." : editingBanner ? "Save Changes" : "Create Banner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
