"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

function ResetPasswordContent() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage("");
    if (!token) { setError("This reset link is incomplete."); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const response = await api.post<{ message?: string }>("/auth/reset-password", { token, password });
      setMessage(response.message ?? "Password updated. You can now sign in.");
    } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "Could not reset your password."); }
    finally { setLoading(false); }
  }

  return <main className="section-container flex min-h-[70vh] items-center justify-center py-16"><section className="w-full max-w-md"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Account recovery</p><h1 className="section-heading mt-3">Set a new password</h1><form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-sm font-medium">New password<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-11 w-full border border-input bg-background px-3 text-sm" /><span className="mt-1 block text-xs text-muted-foreground">At least 8 characters, one uppercase letter, and one number.</span></label><label className="block text-sm font-medium">Confirm new password<input type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 h-11 w-full border border-input bg-background px-3 text-sm" /></label>{message && <p role="status" className="text-sm text-brand-700">{message}</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" isLoading={loading} className="w-full">Update password</Button></form><p className="mt-6 text-center text-sm"><Link href="/login" className="font-semibold text-brand-700">Back to sign in</Link></p></section></main>;
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="section-container py-24 text-center">Loading password reset...</main>}><ResetPasswordContent /></Suspense>;
}
