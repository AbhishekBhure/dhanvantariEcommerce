"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@dhanvantari.in");
  const [password, setPassword] = useState("Admin@1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(""); try { await api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }); router.replace("/"); } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "Unable to sign in."); } finally { setLoading(false); } }
  return <main className="flex min-h-screen items-center justify-center bg-[#123c32] p-6"><form onSubmit={submit} className="w-full max-w-md bg-white p-8"><p className="text-sm font-semibold uppercase tracking-widest text-brand-600">Dhanvantari</p><h1 className="mt-3 text-3xl font-bold">Admin sign in</h1><p className="mt-2 text-sm text-slate-500">Manage your store operations.</p><div className="mt-8 space-y-4"><div><label className="mb-1 block text-sm font-medium" htmlFor="email">Email</label><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 w-full border px-3 text-sm" /></div><div><label className="mb-1 block text-sm font-medium" htmlFor="password">Password</label><input id="password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full border px-3 text-sm" /></div>{error && <p className="text-sm text-red-700">{error}</p>}<button disabled={loading} className="h-11 w-full bg-brand-600 font-semibold text-white disabled:opacity-60">{loading ? "Signing in..." : "Sign in"}</button></div></form></main>;
}
