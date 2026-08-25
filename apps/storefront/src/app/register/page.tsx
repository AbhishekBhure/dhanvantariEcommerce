"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, Leaf } from "lucide-react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/authSlice";
import { Button } from "@/components/ui/button";

type RegisterResponse = { data: { user: { id: string; email: string; name: string } } };
type MeResponse = { data: { user: Parameters<typeof setUser>[0] } };

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const sessionId = window.localStorage.getItem("dhanvantari-session-id")?.trim();
      const headers = sessionId ? { "x-session-id": sessionId } : undefined;
      await api.post<RegisterResponse>("/auth/register", { ...form, phone: form.phone || undefined }, { headers });
      const me = await api.get<MeResponse>("/auth/me");
      dispatch(setUser(me.data.user));
      router.push("/cart");
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Unable to create your account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="section-container grid min-h-[calc(100vh-9rem)] items-center py-12 md:grid-cols-2 md:gap-20">
      <div className="hidden md:block"><div className="max-w-md border-l-4 border-gold-500 pl-8"><Leaf className="h-8 w-8 text-brand-600" aria-hidden="true" /><h1 className="mt-6 font-display text-5xl font-bold leading-tight">Make space for better rituals.</h1><p className="mt-5 leading-relaxed text-muted-foreground">Create your account to keep your details ready for a smoother checkout.</p></div></div>
      <div className="mx-auto w-full max-w-md">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Account</p>
        <h1 className="section-heading mt-3">Create an account</h1>
        <p className="mt-3 text-muted-foreground">Join Dhanvantari and keep your wellness essentials together.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div><label htmlFor="name" className="mb-2 block text-sm font-medium">Full name</label><input id="name" required minLength={2} autoComplete="name" value={form.name} onChange={(event) => updateField("name", event.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
          <div><label htmlFor="email" className="mb-2 block text-sm font-medium">Email address</label><input id="email" type="email" required autoComplete="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
          <div><label htmlFor="phone" className="mb-2 block text-sm font-medium">Phone <span className="font-normal text-muted-foreground">(optional)</span></label><input id="phone" type="tel" inputMode="numeric" autoComplete="tel" pattern="[6-9][0-9]{9}" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
          <div><label htmlFor="password" className="mb-2 block text-sm font-medium">Password</label><input id="password" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={(event) => updateField("password", event.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /><p className="mt-1 text-xs text-muted-foreground">At least 8 characters, including one uppercase letter and one number.</p></div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="w-full bg-brand-600 text-white hover:bg-brand-700" isLoading={isLoading}>Create account <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">Already have an account? <Link href="/login" className="font-semibold text-brand-700 hover:text-brand-900">Sign in</Link></p>
      </div>
    </main>
  );
}
