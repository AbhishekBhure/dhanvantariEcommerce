"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage(""); setError("");
    try {
      const response = await api.post<{ message?: string }>("/auth/forgot-password", { email });
      setMessage(response.message ?? "If an account exists for that email, password reset instructions have been sent.");
    } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "Could not request a password reset."); }
    finally { setLoading(false); }
  }

  return <main className="section-container flex min-h-[70vh] items-center justify-center py-16"><section className="w-full max-w-md"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Account recovery</p><h1 className="section-heading mt-3">Forgot password?</h1><p className="mt-3 text-muted-foreground">Enter your account email and we’ll send a time-limited reset link.</p><form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-sm font-medium">Email address<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full border border-input bg-background px-3 text-sm" /></label>{message && <p role="status" className="text-sm text-brand-700">{message}</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" isLoading={loading} className="w-full">Send reset link</Button></form><p className="mt-6 text-center text-sm"><Link href="/login" className="font-semibold text-brand-700">Back to sign in</Link></p></section></main>;
}
