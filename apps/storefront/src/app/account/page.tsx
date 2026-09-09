"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, LogOut, Package, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { loadCurrentUser, logoutUser } from "@/store/authSlice";
import { Button } from "@/components/ui/button";
import AddressBook from "./AddressBook";

export default function AccountPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [isLoading, setIsLoading] = useState(!user);

  useEffect(() => {
    if (user) return;
    void dispatch(loadCurrentUser()).then((result) => { if (loadCurrentUser.rejected.match(result)) router.replace("/login"); setIsLoading(false); });
  }, [dispatch, router, user]);

  async function handleLogout() {
    await dispatch(logoutUser());
    router.replace("/login");
  }

  if (isLoading) return <main className="section-container py-24 text-center text-muted-foreground">Loading your account...</main>;
  if (!user) return null;

  return <main className="section-container min-h-screen py-10 md:py-16"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Your space</p><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><h1 className="section-heading mt-3">Hello, {user.name.replace("[DEMO] ", "")}</h1><p className="mt-3 text-muted-foreground">Manage your orders and account details.</p></div><Button variant="outline" onClick={() => void handleLogout()}><LogOut className="mr-2 h-4 w-4" aria-hidden="true" /> Sign out</Button></div><div className="mt-10 grid gap-4 md:grid-cols-2"><Link href="/account/orders" className="group border border-border p-6 hover:border-brand-500 hover:bg-brand-50"><Package className="h-7 w-7 text-brand-600" aria-hidden="true" /><h2 className="mt-5 font-display text-2xl font-bold">Your orders</h2><p className="mt-2 text-sm text-muted-foreground">View order status, items, and delivery details.</p><span className="mt-5 inline-flex items-center text-sm font-semibold text-brand-700">View orders <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span></Link><div className="border border-border p-6"><UserRound className="h-7 w-7 text-brand-600" aria-hidden="true" /><h2 className="mt-5 font-display text-2xl font-bold">Account details</h2><p className="mt-2 text-sm text-muted-foreground">{user.email}</p><p className="mt-1 text-sm text-muted-foreground">{user.phone ?? "No phone number added"}</p></div></div><AddressBook /></main>;
}
