"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Search, User, Menu, X, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";

const NAV_LINKS = [
  { href: "/shop", label: "Shop All" },
  { href: "/cart", label: "Cart" },
  { href: "/categories/hair-care", label: "Hair Care" },
  { href: "/categories/skin-care", label: "Skin Care" },
  { href: "/categories/health-wellness", label: "Wellness" },
  { href: "/about", label: "About" },
];

export default function Header() {
  const pathname = usePathname();
  const cartItems = useAppSelector((state) => state.cart.items);
  const user = useAppSelector((state) => state.auth.user);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-brand-700 text-white text-xs text-center py-2 px-4">
        🌿 Free shipping on orders above ₹499 &nbsp;|&nbsp; Use code{" "}
        <span className="font-bold">WELCOME10</span> for 10% off your first order
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-all duration-300",
          isScrolled
            ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border"
            : "bg-background border-b border-border"
        )}
        role="banner"
      >
        <div className="section-container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 group"
              aria-label="Dhanvantari Ayurvedic Agencies — Home"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-600 group-hover:bg-brand-700 transition-colors">
                <Leaf className="w-5 h-5 text-white" aria-hidden="true" />
              </div>
              <div className="hidden sm:block">
                <div className="font-display font-bold text-lg text-foreground leading-tight">
                  Dhanvantari
                </div>
                <div className="text-xs text-muted-foreground leading-tight">
                  Ayurvedic Agencies
                </div>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-brand-600 relative pb-1",
                    "after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-brand-600",
                    "after:transition-all after:duration-300 hover:after:w-full",
                    pathname === link.href || pathname.startsWith(link.href + "/")
                      ? "text-brand-700 after:w-full"
                      : "text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(!searchOpen)}
                aria-label="Search products"
                aria-expanded={searchOpen}
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </Button>

              {/* Account */}
              <Link href={user ? "/account" : "/login"} aria-label={user ? "My account" : "Log in"}>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" aria-hidden="true" />
                </Button>
              </Link>

              {/* Cart */}
              <Link href="/cart" aria-label={`Shopping cart — ${cartCount} item${cartCount !== 1 ? "s" : ""}`}>
                <Button variant="ghost" size="icon" className="relative">
                  <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-brand-600 text-white text-xs flex items-center justify-center font-bold"
                    aria-hidden="true"
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
                </Button>
              </Link>

              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Menu className="h-5 w-5" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="border-t border-border bg-background px-4 py-3 animate-fade-in">
            <form
              className="section-container"
              action="/shop"
              method="get"
              role="search"
              onSubmit={(e) => {
                setSearchOpen(false);
              }}
            >
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <input
                  type="search"
                  name="search"
                  placeholder="Search products..."
                  autoFocus
                  className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-input bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Search products"
                />
              </div>
            </form>
          </div>
        )}

        {/* Mobile navigation */}
        {isMobileMenuOpen && (
          <nav
            id="mobile-menu"
            aria-label="Mobile navigation"
            className="lg:hidden border-t border-border bg-background animate-slide-in"
          >
            <ul className="section-container py-4 flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "block px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                      pathname === link.href
                        ? "bg-brand-50 text-brand-700"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={user ? "/account" : "/login"}
                  className="block px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted"
                >
                  {user ? "My Account" : "Login / Register"}
                </Link>
              </li>
              {!user && (
                <li>
                  <Link
                    href="/register"
                    className="block px-4 py-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted"
                  >
                    Create an Account
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        )}
      </header>
    </>
  );
}
