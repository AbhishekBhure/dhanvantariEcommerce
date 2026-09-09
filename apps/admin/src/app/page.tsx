"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Boxes, ClipboardList, IndianRupee, LogOut, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadDashboard, logoutAdmin } from "@/store/adminSlice";

const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const navigation: Array<[string, string]> = [["Dashboard", "/"], ["Products", "/products"], ["Categories", "/categories"], ["Orders", "/orders"], ["Customers", "/customers"]];

export default function AdminHomePage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data, isLoading, error } = useAppSelector((state) => state.admin.dashboard);
  useEffect(() => { void dispatch(loadDashboard()).then((result) => { if (loadDashboard.rejected.match(result) && result.meta.requestStatus === "rejected") router.replace("/login"); }); }, [dispatch, router]);
  async function signOut() { await dispatch(logoutAdmin()); router.replace("/login"); }
  if (error) return <main className="admin-container"><p className="text-red-700">{error}</p></main>;
  if (isLoading || !data) return <main className="admin-container text-slate-500">Loading dashboard...</main>;
  const stats = [["Orders today", data.ordersToday, ClipboardList], ["Pending orders", data.ordersPending, Package], ["Revenue today", money(data.revenueToday), IndianRupee], ["Published products", data.totalProducts, Boxes]] as const;
  return <div className="admin-shell"><aside className="admin-sidebar"><div className="text-xl font-bold">Dhanvantari</div><p className="mt-1 text-sm text-emerald-100">Admin workspace</p><nav className="mt-10 grid gap-2">{navigation.map(([label, href]) => <Link key={href} className="rounded px-3 py-2 text-sm hover:bg-white/10" href={href}>{label}</Link>)}<a className="rounded px-3 py-2 text-sm hover:bg-white/10" href="http://localhost:3000">Storefront</a></nav></aside><main className="admin-main"><div className="admin-container"><header className="flex items-end justify-between border-b pb-7"><div><p className="text-sm font-semibold uppercase tracking-widest text-brand-600">Operations</p><h1 className="mt-2 text-3xl font-bold">Dashboard</h1><p className="mt-2 text-sm text-slate-500">{money(data.totalRevenue)} total revenue</p></div><button type="button" onClick={() => void signOut()} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-700"><LogOut className="h-4 w-4" /> Sign out</button></header><section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stats.map(([label, value, Icon]) => <div key={label} className="border bg-white p-5"><Icon className="h-5 w-5 text-brand-600" /><p className="mt-5 text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>)}</section><section className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]"><div className="border bg-white p-6"><h2 className="text-xl font-bold">Recent orders</h2>{data.recentOrders.length ? <div className="mt-4 divide-y">{data.recentOrders.map((order) => <div key={order.id} className="flex justify-between gap-4 py-4 text-sm"><span><strong className="block">{order.orderNumber}</strong><span className="text-slate-500">{order.user?.name ?? "Guest"}</span></span><span className="text-right"><strong className="block">{money(order.total)}</strong><span className="text-xs uppercase text-brand-600">{order.status.replaceAll("_", " ")}</span></span></div>)}</div> : <p className="mt-5 text-sm text-slate-500">No orders yet.</p>}</div><div className="border bg-white p-6"><h2 className="text-xl font-bold">Low stock</h2>{data.lowStockProducts.length ? <div className="mt-4 divide-y">{data.lowStockProducts.map((product) => <div key={product.id} className="flex gap-3 py-3 text-sm"><span className="text-amber-600">!</span><span className="flex-1">{product.name.replace("[DEMO] ", "")}</span><strong>{product.stock}</strong></div>)}</div> : <p className="mt-5 text-sm text-slate-500">All products are stocked.</p>}</div></section></div></main></div>;
}
