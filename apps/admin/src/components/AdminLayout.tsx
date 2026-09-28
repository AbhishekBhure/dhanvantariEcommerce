"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingBag,
  Users,
  FileText,
  Newspaper,
  Image as ImageIcon,
  Palette,
  ExternalLink,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { logoutAdmin } from "@/store/adminSlice";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const commerceNav: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, exact: true },
  { label: "Products", href: "/products", icon: Package },
  { label: "Categories", href: "/categories", icon: Tags },
  { label: "Orders", href: "/orders", icon: ShoppingBag },
  { label: "Customers", href: "/customers", icon: Users },
];

const cmsNav: NavItem[] = [
  { label: "Pages (CMS)", href: "/cms/pages", icon: FileText },
  { label: "Blog & Articles", href: "/cms/posts", icon: Newspaper },
  { label: "Hero & Banners", href: "/cms/banners", icon: ImageIcon },
  { label: "Store Customizer", href: "/cms/customizer", icon: Palette },
];

export default function AdminLayout({
  children,
  title,
  subtitle,
  actions,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();

  async function handleLogout() {
    await dispatch(logoutAdmin());
    router.replace("/login");
  }

  const isActive = (item: NavItem) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  return (
    <div className="admin-shell">
      {/* ─── Sidebar ────────────────────────────────────────── */}
      <aside className="admin-sidebar flex flex-col justify-between">
        <div>
          {/* Brand */}
          <div className="flex items-center gap-2.5 pb-4 border-b border-emerald-800/60">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 font-bold text-base">
              ध
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Dhanvantari <span className="text-[10px] bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono font-normal">CMS</span>
              </div>
              <p className="text-xs text-emerald-200/70">Storefront Control Suite</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-6 space-y-6">
            {/* Commerce Group */}
            <div>
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-emerald-300/60 mb-2">
                Commerce
              </p>
              <nav className="grid gap-1">
                {commerceNav.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? "bg-white/15 text-white font-medium shadow-sm"
                          : "text-emerald-100/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-emerald-300" : "text-emerald-200/60"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* CMS Group */}
            <div>
              <div className="px-3 flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/60">
                  CMS & Storefront
                </p>
                <Sparkles className="w-3 h-3 text-gold-400/80" />
              </div>
              <nav className="grid gap-1">
                {cmsNav.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? "bg-emerald-500/25 border border-emerald-400/30 text-white font-medium shadow-sm"
                          : "text-emerald-100/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? "text-emerald-300" : "text-emerald-200/60"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-6 border-t border-emerald-800/60 space-y-2 mt-6">
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-emerald-200 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Storefront
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-emerald-200/70 hover:text-red-300 hover:bg-red-950/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content Area ──────────────────────────────── */}
      <main className="admin-main">
        <div className="admin-container">
          {(title || actions) && (
            <header className="flex flex-wrap items-end justify-between gap-4 border-b pb-6 mb-8">
              <div>
                {subtitle && (
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
                    {subtitle}
                  </p>
                )}
                {title && <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{title}</h1>}
              </div>
              {actions && <div className="flex items-center gap-3">{actions}</div>}
            </header>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
