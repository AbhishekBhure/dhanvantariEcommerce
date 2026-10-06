"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";

function VerifyEmailContent() {
  const params = useSearchParams();
  const token = params.get("token");
  const [message, setMessage] = useState("Verifying your email...");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!token) { setMessage("This verification link is incomplete."); setFailed(true); return; }
    void api.post<{ message?: string }>("/auth/verify-email", { token })
      .then((response) => setMessage(response.message ?? "Email verified. You can now sign in."))
      .catch((error) => { setFailed(true); setMessage(error instanceof ApiError ? error.message : "Could not verify your email. Request a new link or contact support."); });
  }, [token]);

  return <main className="section-container flex min-h-[70vh] items-center justify-center py-16"><section className="w-full max-w-lg border border-border px-6 py-12 text-center"><h1 className="section-heading">{failed ? "Verification failed" : "Email verification"}</h1><p role="status" className="mt-4 text-muted-foreground">{message}</p><Link href="/login" className="mt-8 inline-flex h-11 items-center justify-center bg-brand-600 px-6 text-sm font-semibold text-white">Continue to sign in</Link></section></main>;
}

export default function VerifyEmailPage() {
  return <Suspense fallback={<main className="section-container py-24 text-center">Loading verification...</main>}><VerifyEmailContent /></Suspense>;
}
