"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  Edit3,
  Globe,
  Save,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link2,
  Image as ImageIcon,
  Code,
  Tag,
  User,
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createPost,
  updatePost,
  deletePost,
  BlogPost,
} from "@/store/adminSlice";

const COMMON_CATEGORIES = [
  "Hair Care",
  "Skin Care",
  "Ayurvedic Rituals",
  "Daily Routine",
  "Health & Wellness",
  "Herbal Ingredients",
];

interface PostEditorProps {
  initialPost?: BlogPost | null;
  isNew?: boolean;
}

export default function PostEditor({ initialPost, isNew }: PostEditorProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const mutation = useAppSelector((state) => state.admin.mutation);

  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [slug, setSlug] = useState(initialPost?.slug ?? "");
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [category, setCategory] = useState(initialPost?.category ?? "Ayurvedic Rituals");
  const [tags, setTags] = useState(initialPost?.tags ?? "");
  const [authorName, setAuthorName] = useState(initialPost?.authorName ?? "Dr. Arvind Shastri (Chief Vaidya)");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? "");
  const [content, setContent] = useState(initialPost?.content ?? "");
  const [coverImage, setCoverImage] = useState(initialPost?.coverImage ?? "");
  const [isPublished, setIsPublished] = useState(initialPost?.isPublished ?? true);
  const [metaTitle, setMetaTitle] = useState(initialPost?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(initialPost?.metaDescription ?? "");
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function handleTitleChange(val: string) {
    setTitle(val);
    if (isNew && !isEditingSlug) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generated);
    }
  }

  function insertFormatting(prefix: string, suffix: string = "") {
    const textarea = document.getElementById("post-content-area") as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const before = content.substring(0, start);
    const after = content.substring(end);

    const replacement = `${prefix}${selected || "text"}${suffix}`;
    setContent(`${before}${replacement}${after}`);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 10);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setErrorMsg("Post title is required.");
      return;
    }
    if (!content.trim()) {
      setErrorMsg("Post content cannot be empty.");
      return;
    }

    const payload = {
      title: title.trim(),
      slug: slug.trim() || undefined,
      excerpt: excerpt.trim() || null,
      content,
      coverImage: coverImage.trim() || null,
      category: category.trim() || null,
      tags: tags.trim() || null,
      authorName: authorName.trim() || "Dhanvantari Vaidya",
      isPublished,
      metaTitle: metaTitle.trim() || null,
      metaDescription: metaDescription.trim() || null,
    };

    try {
      if (isNew) {
        await dispatch(createPost(payload)).unwrap();
        router.push("/cms/posts");
      } else if (initialPost) {
        await dispatch(updatePost({ id: initialPost.id, data: payload })).unwrap();
        setSuccessMsg("Article updated successfully!");
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setErrorMsg(typeof err === "string" ? err : "Failed to save article.");
    }
  }

  async function handleDelete() {
    if (!initialPost) return;
    if (!window.confirm(`Are you sure you want to delete "${initialPost.title}"?`)) return;

    try {
      await dispatch(deletePost(initialPost.id)).unwrap();
      router.push("/cms/posts");
    } catch (err: any) {
      setErrorMsg(typeof err === "string" ? err : "Failed to delete article.");
    }
  }

  const liveStorefrontUrl = `http://localhost:3000/blog/${slug || "slug"}`;

  return (
    <AdminLayout
      title={isNew ? "Write New Article" : `Edit Article: ${initialPost?.title}`}
      subtitle="Wellness Journal & CMS"
      actions={
        <div className="flex items-center gap-3">
          <Link
            href="/cms/posts"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-lg hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Articles
          </Link>
          {!isNew && initialPost && (
            <a
              href={liveStorefrontUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View on Store
            </a>
          )}
        </div>
      }
    >
      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* ─── Left Column: Main Article Content ─────────────── */}
        <div className="space-y-6">
          {/* Title & Slug */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Article Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. The Ancient Secret of Bhringraj for Hair Fall Control"
              className="w-full text-xl font-bold px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />

            {/* Slug URL Bar with [slug] customizer */}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border">
              <span className="font-mono text-slate-400">Store URL:</span>
              <span className="font-mono text-slate-600">/blog/</span>
              {isEditingSlug ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) =>
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9-]+/g, "-")
                      )
                    }
                    className="font-mono text-emerald-700 bg-white border border-emerald-400 px-2 py-0.5 rounded text-xs focus:outline-none flex-1 max-w-xs"
                    placeholder="article-slug"
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingSlug(false)}
                    className="text-xs text-emerald-700 font-semibold hover:underline"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {slug || "[slug]"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditingSlug(true)}
                    className="text-xs text-slate-500 hover:text-emerald-700 underline inline-flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" /> Edit Slug
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content Editor Card */}
          <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
            <div className="border-b px-4 py-2.5 bg-slate-50/80 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => insertFormatting("**", "**")}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded transition-colors"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("*", "*")}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded transition-colors"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                <button
                  type="button"
                  onClick={() => insertFormatting("## ", "")}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded transition-colors"
                  title="Heading 2"
                >
                  <Heading2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("### ", "")}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded transition-colors"
                  title="Heading 3"
                >
                  <Heading3 className="w-4 h-4" />
                </button>
                <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                <button
                  type="button"
                  onClick={() => insertFormatting("* ", "")}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded transition-colors"
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("1. ", "")}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded transition-colors"
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("> ", "")}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded transition-colors"
                  title="Blockquote"
                >
                  <Quote className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("[Link](", ")")}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded transition-colors"
                  title="Link"
                >
                  <Link2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("![Alt](", ")")}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded transition-colors"
                  title="Image"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => insertFormatting("`", "`")}
                  className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded transition-colors"
                  title="Code"
                >
                  <Code className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab("write")}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    activeTab === "write" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1 ${
                    activeTab === "preview" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Eye className="w-3 h-3" /> Preview
                </button>
              </div>
            </div>

            {activeTab === "write" ? (
              <textarea
                id="post-content-area"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article in Markdown. Share Ayurvedic wisdom, ingredient spotlights, lifestyle routines, dosha balancing guidance..."
                rows={18}
                className="w-full p-5 font-mono text-sm leading-relaxed focus:outline-none resize-y"
                required
              />
            ) : (
              <div className="p-6 prose max-w-none min-h-[400px] bg-slate-50/50">
                {content.trim() ? (
                  <div className="space-y-4 text-slate-800 leading-relaxed">
                    {content.split("\n\n").map((block, idx) => {
                      if (block.startsWith("## ")) {
                        return <h2 key={idx} className="text-2xl font-bold text-slate-900 border-b pb-2">{block.replace("## ", "")}</h2>;
                      }
                      if (block.startsWith("### ")) {
                        return <h3 key={idx} className="text-lg font-semibold text-slate-900">{block.replace("### ", "")}</h3>;
                      }
                      if (block.startsWith("> ")) {
                        return <blockquote key={idx} className="border-l-4 border-emerald-600 pl-4 italic text-slate-600 my-2">{block.replace("> ", "")}</blockquote>;
                      }
                      return <p key={idx} className="text-slate-700 whitespace-pre-wrap">{block}</p>;
                    })}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No content to preview.</p>
                )}
              </div>
            )}
          </div>

          {/* Excerpt Card */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Article Excerpt / Teaser
            </label>
            <p className="text-xs text-slate-400 mb-3">
              Appears on blog listing cards, social share cards, and newsletters.
            </p>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="e.g. Known in Ayurvedic texts as 'Keshraj', Bhringraj balances Pitta dosha to stop root thinning and stimulate hair regrowth..."
              rows={3}
              className="w-full text-sm px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* SEO Meta Box Card */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                SEO & Social Meta
              </h3>
            </div>

            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-[11px] font-mono text-slate-400 mb-1">Google Search Preview</p>
              <p className="text-xs text-slate-500 truncate">https://dhanvantari.in/blog/{slug || "slug"}</p>
              <h4 className="text-blue-700 font-medium text-base hover:underline cursor-pointer truncate mt-0.5">
                {metaTitle || title || "Article Title | Dhanvantari Wellness Journal"}
              </h4>
              <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                {metaDescription || excerpt || "Holistic Ayurvedic wellness insights and traditional herbal knowledge from Dhanvantari Vaidyas."}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-600">Meta Title</label>
                  <span className="text-[11px] text-slate-400">{metaTitle.length}/60</span>
                </div>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="e.g. Bhringraj Hair Oil Benefits | Dhanvantari Journal"
                  className="w-full text-sm px-3.5 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-600">Meta Description</label>
                  <span className="text-[11px] text-slate-400">{metaDescription.length}/160</span>
                </div>
                <textarea
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  placeholder="Compelling description for search engines..."
                  rows={2}
                  className="w-full text-sm px-3.5 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right Column: Meta, Cover & Publishing ───────── */}
        <div className="space-y-6">
          {/* Publish Action Box */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-3 border-b mb-4">
              Publish Settings
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-700 block">Status</span>
                  <span className="text-[11px] text-slate-500">
                    {isPublished ? "Published to Journal" : "Draft / Unpublished"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublished(!isPublished)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isPublished ? "bg-emerald-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isPublished ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="pt-3 border-t text-xs">
                <span className="text-slate-400 block mb-1">Route Path:</span>
                <span className="font-mono text-emerald-800 bg-emerald-50 px-2 py-1 rounded block truncate border border-emerald-200">
                  /blog/{slug || "slug"}
                </span>
              </div>

              <div className="pt-4 border-t space-y-2">
                <button
                  type="submit"
                  disabled={mutation.isLoading}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {mutation.isLoading ? "Saving..." : isNew ? "Publish Article" : "Save Changes"}
                </button>

                {!isNew && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={mutation.isLoading}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Article
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Category & Tags Box */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-3 border-b">
              Organization
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 mb-1.5">
                <Tag className="w-3.5 h-3.5 text-emerald-600" /> Category
              </label>
              <input
                type="text"
                list="category-suggestions"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Choose or type category..."
                className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <datalist id="category-suggestions">
                {COMMON_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. Bhringraj, Hair Fall, Doshas"
                className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-1 mb-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" /> Author Name
              </label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Author name..."
                className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Featured Cover Image */}
          <div className="bg-white border rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 pb-3 border-b mb-4">
              Cover Image
            </h3>
            <div className="space-y-3">
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {coverImage ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImage}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className="aspect-video rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                  <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                  <span className="text-[11px]">Enter a photo URL to set as cover</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
