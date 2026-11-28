"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Leaf } from "lucide-react";
import { useRouter } from "next/navigation";
import { registerUser, resendRegistrationOtp, verifyRegistrationEmailOtp } from "@/store/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const RESEND_COOLDOWN_SECONDS = 60;

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [otp, setOtp] = useState("");
  const [awaitingOtp, setAwaitingOtp] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [nextPath, setNextPath] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    setNextPath(new URLSearchParams(window.location.search).get("next") ?? "");
  }, []);

  useEffect(() => {
    if (resendSeconds === 0) return;
    const timer = window.setTimeout(() => {
      setResendSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const result = await dispatch(registerUser({
        ...form,
        email: form.email.trim().toLowerCase(),
      }));
      if (registerUser.rejected.match(result)) throw new Error(result.payload as string ?? "Unable to create your account.");
      setAwaitingOtp(true);
      setResendSeconds(RESEND_COOLDOWN_SECONDS);
      setMessage("Enter the 4-digit verification code sent to your email.");
      toast({
        title: "OTP sent to email",
        description: `Check ${form.email.trim()} for your 4-digit verification code.`,
        variant: "success",
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create your account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const result = await dispatch(verifyRegistrationEmailOtp({ email: form.email.trim().toLowerCase(), code: otp }));
      if (verifyRegistrationEmailOtp.rejected.match(result)) throw new Error(result.payload as string ?? "Could not verify your email address.");
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next?.startsWith("/") && !next.startsWith("//") ? next : "/cart");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not verify your phone number.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendOtp() {
    setError("");
    setMessage("");
    setIsLoading(true);
    try {
      const result = await dispatch(resendRegistrationOtp(form.phone));
      if (resendRegistrationOtp.rejected.match(result)) throw new Error(result.payload as string ?? "Could not resend the verification code.");
      setResendSeconds(RESEND_COOLDOWN_SECONDS);
      setMessage("A new verification code has been sent to your email.");
      toast({
        title: "OTP sent to email",
        description: `Check ${form.email.trim()} for your 4-digit verification code.`,
        variant: "success",
      });
    } catch (requestError) {
      const errorMessage = requestError instanceof Error ? requestError.message : "Could not resend the verification code.";
      if (errorMessage.includes("Wait one minute")) {
        setResendSeconds(RESEND_COOLDOWN_SECONDS);
        setMessage("A code was recently sent. You can request another when the timer ends.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }

  const loginHref = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";

  return (
    <main className="section-container grid min-h-[calc(100vh-9rem)] items-center py-12 md:grid-cols-2 md:gap-20">
      <div className="hidden md:block"><div className="max-w-md border-l-4 border-gold-500 pl-8"><Leaf className="h-8 w-8 text-brand-600" aria-hidden="true" /><h1 className="mt-6 font-display text-5xl font-bold leading-tight">Make space for better rituals.</h1><p className="mt-5 leading-relaxed text-muted-foreground">Create your account to keep your details ready for a smoother checkout.</p></div></div>
      <div className="mx-auto w-full max-w-md">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Account</p>
        <h1 className="section-heading mt-3">Create an account</h1>
        <p className="mt-3 text-muted-foreground">Join Dhanvantari and keep your wellness essentials together.</p>
        {!awaitingOtp ? <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div><label htmlFor="phone" className="mb-2 block text-sm font-medium">Mobile number</label><input id="phone" type="tel" inputMode="numeric" autoComplete="tel" required pattern="[6-9][0-9]{9}" maxLength={10} value={form.phone} onChange={(event) => updateField("phone", event.target.value.replace(/\D/g, "").slice(0, 10))} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
          <div><label htmlFor="name" className="mb-2 block text-sm font-medium">Full name</label><input id="name" required minLength={2} autoComplete="name" value={form.name} onChange={(event) => updateField("name", event.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
          <div><label htmlFor="email" className="mb-2 block text-sm font-medium">Email address</label><input id="email" type="email" required autoComplete="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /><p className="mt-1 text-xs text-muted-foreground">A verification code will be sent to this email address.</p></div>
          <div><label htmlFor="password" className="mb-2 block text-sm font-medium">Password</label><input id="password" type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={(event) => updateField("password", event.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" /><p className="mt-1 text-xs text-muted-foreground">At least 8 characters, including one uppercase letter and one number.</p></div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="w-full bg-brand-600 text-white hover:bg-brand-700" isLoading={isLoading}>Create account <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
        </form> : <form onSubmit={handleVerifyOtp} className="mt-8 space-y-4">
          <p className="text-sm text-muted-foreground">Enter the 4-digit code sent to {form.email}.</p>
          <div><label htmlFor="registration-otp" className="mb-2 block text-sm font-medium">Verification code</label><input id="registration-otp" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{4}" maxLength={4} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 4))} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-ring" /></div>
          {message && <p role="status" className="text-sm text-brand-700">{message}</p>}
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button type="submit" size="lg" className="w-full bg-brand-600 text-white hover:bg-brand-700" isLoading={isLoading}>Verify email</Button>
          <button type="button" onClick={() => void handleResendOtp()} disabled={isLoading || resendSeconds > 0} className="w-full text-sm font-semibold text-brand-700 disabled:opacity-50">{resendSeconds > 0 ? `Resend code in 00:${String(resendSeconds).padStart(2, "0")}` : "Resend code"}</button>
          {resendSeconds > 0 && <p role="status" className="text-center text-xs text-muted-foreground">You can request another code in {resendSeconds} seconds.</p>}
        </form>}
        {!awaitingOtp && <p className="mt-6 text-center text-sm text-muted-foreground">Already have an account? <Link href={loginHref} className="font-semibold text-brand-700 hover:text-brand-900">Sign in</Link></p>}
      </div>
    </main>
  );
}
