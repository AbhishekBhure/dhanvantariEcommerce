"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Leaf } from "lucide-react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [nextPath, setNextPath] = useState("");

  useEffect(() => {
    setNextPath(new URLSearchParams(window.location.search).get("next") ?? "");
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const credentials = identifier.includes("@")
        ? { email: identifier.trim(), password }
        : { phone: identifier.replace(/\D/g, "").slice(-10), password };
      const result = await dispatch(loginUser(credentials));
      if (loginUser.rejected.match(result)) throw new Error(result.payload as string ?? "Unable to sign in.");
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next?.startsWith("/") && !next.startsWith("//") ? next : "/cart");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const registerHref = nextPath ? `/register?next=${encodeURIComponent(nextPath)}` : "/register";

  return (
    <main className="section-container grid min-h-[calc(100vh-9rem)] items-center py-12 md:grid-cols-2 md:gap-20">
      <div className="hidden md:block">
        <div className="max-w-md border-l-4 border-gold-500 pl-8">
          <Leaf className="h-8 w-8 text-brand-600" aria-hidden="true" />
          <h1 className="mt-6 font-display text-5xl font-bold leading-tight">Welcome back to your daily ritual.</h1>
          <p className="mt-5 leading-relaxed text-muted-foreground">Keep your favourites close, manage your addresses, and follow every order from one place.</p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-md">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Account</p>
        <h1 className="section-heading mt-3">Sign in</h1>
        <p className="mt-3 text-muted-foreground">Use your Dhanvantari account to continue.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div><label htmlFor="identifier" className="mb-2 block text-sm font-medium">Email or mobile number</label><input id="identifier" type="text" inputMode={identifier.includes("@") ? "email" : "tel"} autoComplete="username" required value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /><p className="mt-1 text-xs text-muted-foreground">Use your verified email or verified mobile number.</p></div>
          <div><label htmlFor="password" className="mb-2 block text-sm font-medium">Password</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="w-full bg-brand-600 text-white hover:bg-brand-700" isLoading={isLoading}>Sign in <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
        </form>
        <p className="mt-4 text-center text-sm"><Link href="/forgot-password" className="font-semibold text-brand-700 hover:text-brand-900">Forgot password?</Link></p>
        <p className="mt-4 text-center text-sm text-muted-foreground">New here? <Link href={registerHref} className="font-semibold text-brand-700 hover:text-brand-900">Create an account</Link></p>
      </div>
    </main>
  );
}
