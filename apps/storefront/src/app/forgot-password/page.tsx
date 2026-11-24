"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage(""); setError("");
    try {
      const response = await api.post<{ message?: string }>("/auth/forgot-password", { email });
      setMessage(response.message ?? "If an account exists for that email, password reset instructions have been sent.");
    } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "Could not request a password reset."); }
    finally { setLoading(false); }
  }

  async function sendPhoneCode() {
    setLoading(true); setMessage(""); setError("");
    try {
      const response = await api.post<{ message?: string }>("/auth/phone-otp/password/send", { phone });
      setOtpSent(true);
      setMessage(response.message ?? "If a verified account exists for this number, a code has been sent.");
    } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "Could not request a verification code."); }
    finally { setLoading(false); }
  }

  async function resetWithPhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage(""); setError("");
    if (password !== confirmPassword) { setError("Passwords do not match."); setLoading(false); return; }
    try {
      const response = await api.post<{ message?: string }>("/auth/phone-otp/password/reset", { phone, code, password });
      setMessage(response.message ?? "Password updated. You can now sign in.");
    } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : "Could not reset your password."); }
    finally { setLoading(false); }
  }

  return <main className="section-container flex min-h-[70vh] items-center justify-center py-16"><section className="w-full max-w-md"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Account recovery</p><h1 className="section-heading mt-3">Forgot password?</h1><p className="mt-3 text-muted-foreground">Reset access using the primary phone number on your account.</p><div className="mt-6 flex gap-4 border-b border-border text-sm"><button type="button" onClick={() => { setMethod("phone"); setMessage(""); setError(""); }} className={`pb-2 font-semibold ${method === "phone" ? "border-b-2 border-brand-600 text-brand-700" : "text-muted-foreground"}`}>Phone number</button><button type="button" onClick={() => { setMethod("email"); setMessage(""); setError(""); }} className={`pb-2 font-semibold ${method === "email" ? "border-b-2 border-brand-600 text-brand-700" : "text-muted-foreground"}`}>Email link</button></div>{method === "email" ? <form onSubmit={submitEmail} className="mt-8 space-y-5"><label className="block text-sm font-medium">Email address<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-11 w-full border border-input bg-background px-3 text-sm" /></label>{message && <p role="status" className="text-sm text-brand-700">{message}</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type="submit" isLoading={loading} className="w-full">Send reset link</Button></form> : <form onSubmit={resetWithPhone} className="mt-8 space-y-5"><label className="block text-sm font-medium">Mobile number<input type="tel" inputMode="numeric" autoComplete="tel" required pattern="[6-9][0-9]{9}" maxLength={10} value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))} disabled={otpSent} className="mt-2 h-11 w-full border border-input bg-background px-3 text-sm disabled:bg-muted" /></label>{otpSent && <><label className="block text-sm font-medium">4-digit code<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{4}" maxLength={4} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 4))} className="mt-2 h-11 w-full border border-input bg-background px-3 text-sm tracking-[0.3em]" /></label><label className="block text-sm font-medium">New password<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-11 w-full border border-input bg-background px-3 text-sm" /><span className="mt-1 block text-xs text-muted-foreground">At least 8 characters, one uppercase letter, and one number.</span></label><label className="block text-sm font-medium">Confirm new password<input type="password" required minLength={8} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 h-11 w-full border border-input bg-background px-3 text-sm" /></label></>}{message && <p role="status" className="text-sm text-brand-700">{message}</p>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button type={otpSent ? "submit" : "button"} onClick={!otpSent ? () => void sendPhoneCode() : undefined} isLoading={loading} className="w-full">{otpSent ? "Reset password" : "Send verification code"}</Button>{otpSent && <button type="button" onClick={() => void sendPhoneCode()} disabled={loading} className="w-full text-sm font-semibold text-brand-700 disabled:opacity-50">Resend code</button>}</form>}<p className="mt-6 text-center text-sm"><Link href="/login" className="font-semibold text-brand-700">Back to sign in</Link></p></section></main>;
}
