"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Boxes,
  ClipboardList,
  IndianRupee,
  Package,
  FileText,
  Newspaper,
  Image as ImageIcon,
  Palette,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  loadDashboard,
  loadPages,
  loadPosts,
  loadBanners,
} from "@/store/adminSlice";

const money = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export default function AdminHomePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data, isLoading, error } = useAppSelector((state) => state.admin.dashboard);
  const pages = useAppSelector((state) => state.admin.pages.items);
  const posts = useAppSelector((state) => state.admin.posts.items);
  const banners = useAppSelector((state) => state.admin.banners.items);

  useEffect(() => {
    void dispatch(loadDashboard()).then((result) => {
      if (loadDashboard.rejected.match(result) && result.meta.requestStatus === "rejected") {
        router.replace("/login");
      }
    });
    void dispatch(loadPages());
    void dispatch(loadPosts());
    void dispatch(loadBanners());
  }, [dispatch, router]);

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="p-8 text-slate-500">
        Loading dashboard...
      </div>
    );
  }

  const stats = [
    ["Orders today", data.ordersToday, ClipboardList],
    ["Pending orders", data.ordersPending, Package],
    ["Revenue today", money(data.revenueToday), IndianRupee],
    ["Published products", data.totalProducts, Boxes],
  ] as const;

  return (
    <AdminLayout
      title="Store Operations & CMS Overview"
      subtitle="Dhanvantari Administration"
      actions={
        <a
          href="http://localhost:3000"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-xl hover:bg-emerald-100 transition-colors shadow-xs"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          View Live Storefront <ExternalLink className="w-3.5 h-3.5" />
        </a>
      }
    >
      {/* ─── Operations Stats Row ───────────────────────────── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([label, value, Icon]) => (
          <div key={label} className="border bg-white rounded-2xl p-5 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Icon className="h-5 w-5 text-emerald-700" />
            </div>
            <p className="mt-4 text-xs font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </section>

      {/* ─── CMS & Storefront Control Hub ───────────────────── */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">CMS & Storefront Controls</h2>
            <p className="text-xs text-slate-500">Manage pages, blog posts, hero banners, and visual customizer</p>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            WordPress-grade headless CMS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pages Card */}
          <div className="bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {pages.length} Pages
                </span>
              </div>
              <h3 className="mt-3 font-bold text-slate-900 text-sm">Storefront Pages</h3>
              <p className="mt-1 text-xs text-slate-500">
                Custom policy, story, and landing pages with dynamic [slug] routing.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs">
              <Link href="/cms/pages/new" className="text-blue-700 font-semibold hover:underline">
                + New Page
              </Link>
              <Link href="/cms/pages" className="text-slate-500 hover:text-slate-800 flex items-center gap-1">
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Blog / Articles Card */}
          <div className="bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Newspaper className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {posts.length} Posts
                </span>
              </div>
              <h3 className="mt-3 font-bold text-slate-900 text-sm">Wellness Journal</h3>
              <p className="mt-1 text-xs text-slate-500">
                Ayurvedic articles, dosha guides, and remedies with custom [slug].
              </p>
            </div>
            <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs">
              <Link href="/cms/posts/new" className="text-emerald-700 font-semibold hover:underline">
                + Write Post
              </Link>
              <Link href="/cms/posts" className="text-slate-500 hover:text-slate-800 flex items-center gap-1">
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Banners Card */}
          <div className="bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {banners.length} Banners
                </span>
              </div>
              <h3 className="mt-3 font-bold text-slate-900 text-sm">Hero & Promotions</h3>
              <p className="mt-1 text-xs text-slate-500">
                Control top homepage carousel, CTAs, button links, and promos.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs">
              <Link href="/cms/banners" className="text-amber-700 font-semibold hover:underline">
                Manage Slides
              </Link>
              <Link href="/cms/banners" className="text-slate-500 hover:text-slate-800 flex items-center gap-1">
                View <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Customizer Card */}
          <div className="bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Palette className="w-4 h-4" />
                </div>
                <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>
              <h3 className="mt-3 font-bold text-slate-900 text-sm">Store Customizer</h3>
              <p className="mt-1 text-xs text-slate-500">
                Announcement banner, trust pillars, brand story, and socials.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs">
              <Link href="/cms/customizer" className="text-purple-700 font-semibold hover:underline">
                Customize Theme
              </Link>
              <Link href="/cms/customizer" className="text-slate-500 hover:text-slate-800 flex items-center gap-1">
                Open <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Orders & Stock Sections ────────────────────────── */}
      <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="border bg-white rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Recent Customer Orders</h2>
            <Link href="/orders" className="text-xs font-semibold text-emerald-700 hover:underline">
              View All
            </Link>
          </div>
          {data.recentOrders.length ? (
            <div className="divide-y">
              {data.recentOrders.map((order) => (
                <div key={order.id} className="flex justify-between gap-4 py-3.5 text-sm">
                  <span>
                    <strong className="block text-slate-900">{order.orderNumber}</strong>
                    <span className="text-xs text-slate-500">{order.user?.name ?? "Guest Customer"}</span>
                  </span>
                  <span className="text-right">
                    <strong className="block text-slate-900">{money(order.total)}</strong>
                    <span className="text-[11px] font-mono uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      {order.status.replaceAll("_", " ")}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-400">No orders yet.</p>
          )}
        </div>

        <div className="border bg-white rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Low Stock Alert</h2>
            <Link href="/products" className="text-xs font-semibold text-emerald-700 hover:underline">
              Inventory
            </Link>
          </div>
          {data.lowStockProducts.length ? (
            <div className="divide-y">
              {data.lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 py-3 text-sm">
                  <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                  <span className="flex-1 text-xs font-medium text-slate-800 line-clamp-1">
                    {product.name.replace("[DEMO] ", "")}
                  </span>
                  <strong className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    {product.stock} left
                  </strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-400">All products are healthy in stock.</p>
          )}
        </div>
      </section>
    </AdminLayout>
  );
}
