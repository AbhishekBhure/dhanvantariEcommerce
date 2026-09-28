"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PostEditor from "@/components/cms/PostEditor";
import { api } from "@/lib/api";
import { BlogPost } from "@/store/adminSlice";

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params["id"]) ? params["id"][0] : (params["id"] as string);

  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function fetchPost() {
      try {
        setLoading(true);
        const res = await api<{ data: { post: BlogPost } }>(`/admin/cms/posts/${id}`);
        setPost(res.data.post);
      } catch (err: any) {
        setError(err.message || "Failed to load article");
      } finally {
        setLoading(false);
      }
    }
    void fetchPost();
  }, [id]);

  if (loading) {
    return (
      <div className="admin-shell flex items-center justify-center p-12">
        <p className="text-slate-500 text-sm">Loading article editor...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="admin-shell p-12">
        <div className="max-w-md mx-auto text-center">
          <p className="text-red-600 mb-4">{error ?? "Article not found."}</p>
          <button
            onClick={() => router.push("/cms/posts")}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
          >
            Back to Articles
          </button>
        </div>
      </div>
    );
  }

  return <PostEditor initialPost={post} isNew={false} />;
}
