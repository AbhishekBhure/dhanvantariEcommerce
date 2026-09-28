"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageEditor from "@/components/cms/PageEditor";
import { api } from "@/lib/api";
import { ContentPage } from "@/store/adminSlice";

export default function EditPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params["id"]) ? params["id"][0] : (params["id"] as string);

  const [page, setPage] = useState<ContentPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function fetchPage() {
      try {
        setLoading(true);
        const res = await api<{ data: { page: ContentPage } }>(`/admin/cms/pages/${id}`);
        setPage(res.data.page);
      } catch (err: any) {
        setError(err.message || "Failed to load page");
      } finally {
        setLoading(false);
      }
    }
    void fetchPage();
  }, [id]);

  if (loading) {
    return (
      <div className="admin-shell flex items-center justify-center p-12">
        <p className="text-slate-500 text-sm">Loading page editor...</p>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="admin-shell p-12">
        <div className="max-w-md mx-auto text-center">
          <p className="text-red-600 mb-4">{error ?? "Page not found."}</p>
          <button
            onClick={() => router.push("/cms/pages")}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
          >
            Back to Pages
          </button>
        </div>
      </div>
    );
  }

  return <PageEditor initialPage={page} isNew={false} />;
}
