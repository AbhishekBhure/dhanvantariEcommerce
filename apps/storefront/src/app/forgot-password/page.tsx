"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [method, setMethod] = useState<"phone" | "email">("email");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [emailResendSeconds, setEmailResendSeconds] = useState(0);
  const [phoneResendSeconds, setPhoneResendSeconds] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (emailResendSeconds === 0) return;
    const timer = window.setTimeout(
      () => setEmailResendSeconds((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [emailResendSeconds]);

  useEffect(() => {
    if (phoneResendSeconds === 0) return;
    const timer = window.setTimeout(
      () => setPhoneResendSeconds((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [phoneResendSeconds]);

  async function sendEmailCode() {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await api.post<{ message?: string }>("/auth/email-otp/password/send", {
        email: email.trim().toLowerCase(),
      });
      setEmailOtpSent(true);
      setEmailResendSeconds(RESEND_COOLDOWN_SECONDS);
      setMessage(response.message ?? "If an account exists for this email, a code has been requested.");
      toast({
        title: "Check your email",
        description: "If an account exists for this email, a verification code has been requested.",
      });
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.message.includes("Wait one minute")) {
        setEmailOtpSent(true);
        setEmailResendSeconds(RESEND_COOLDOWN_SECONDS);
        setMessage("A code was recently requested. You can request another when the timer ends.");
      } else {
        setError(requestError instanceof ApiError ? requestError.message : "Could not request a verification code.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function sendPhoneCode() {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const response = await api.post<{ message?: string }>("/auth/phone-otp/password/send", { phone });
      setPhoneOtpSent(true);
      setPhoneResendSeconds(RESEND_COOLDOWN_SECONDS);
      setMessage(response.message ?? "If a verified account exists for this number, a code has been sent.");
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.message.includes("Wait one minute")) {
        setPhoneOtpSent(true);
        setPhoneResendSeconds(RESEND_COOLDOWN_SECONDS);
        setMessage("A code was recently requested. You can request another when the timer ends.");
      } else {
        setError(requestError instanceof ApiError ? requestError.message : "Could not request a verification code.");
      }
    } finally {
      setLoading(false);
    }
  }

  function validatePasswords(): boolean {
    if (password === confirmPassword) return true;
    setError("Passwords do not match.");
    return false;
  }

  async function resetWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    if (!validatePasswords()) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.post<{ message?: string }>("/auth/email-otp/password/reset", {
        email: email.trim().toLowerCase(),
        code,
        password,
      });
      setMessage(response.message ?? "Password updated. You can now sign in.");
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Could not reset your password.");
    } finally {
      setLoading(false);
    }
  }

  async function resetWithPhone(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    if (!validatePasswords()) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.post<{ message?: string }>("/auth/phone-otp/password/reset", {
        phone,
        code,
        password,
      });
      setMessage(response.message ?? "Password updated. You can now sign in.");
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : "Could not reset your password.");
    } finally {
      setLoading(false);
    }
  }

  const passwordFields = (
    <>
      <label className="block text-sm font-medium">
        New password
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 h-11 w-full border border-input bg-background px-3 text-sm"
        />
        <span className="mt-1 block text-xs text-muted-foreground">
          At least 8 characters, one uppercase letter, and one number.
        </span>
      </label>
      <label className="block text-sm font-medium">
        Confirm new password
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="mt-2 h-11 w-full border border-input bg-background px-3 text-sm"
        />
      </label>
    </>
  );

  const verificationCodeField = (
    <label className="block text-sm font-medium">
      4-digit code
      <input
        required
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{4}"
        maxLength={4}
        value={code}
        onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
        className="mt-2 h-11 w-full border border-input bg-background px-3 text-sm tracking-[0.3em]"
      />
    </label>
  );

  return (
    <main className="section-container flex min-h-[70vh] items-center justify-center py-16">
      <section className="w-full max-w-md">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Account recovery</p>
        <h1 className="section-heading mt-3">Forgot password?</h1>
        <p className="mt-3 text-muted-foreground">Reset access using your verified email or phone number.</p>
        <div className="mt-6 flex gap-4 border-b border-border text-sm">
          <button
            type="button"
            onClick={() => { setMethod("email"); setMessage(""); setError(""); }}
            className={`pb-2 font-semibold ${method === "email" ? "border-b-2 border-brand-600 text-brand-700" : "text-muted-foreground"}`}
          >
            Email code
          </button>
          <button
            type="button"
            onClick={() => { setMethod("phone"); setMessage(""); setError(""); }}
            className={`pb-2 font-semibold ${method === "phone" ? "border-b-2 border-brand-600 text-brand-700" : "text-muted-foreground"}`}
          >
            Phone code
          </button>
        </div>

        {method === "email" ? (
          <form onSubmit={emailOtpSent ? resetWithEmail : (event) => { event.preventDefault(); void sendEmailCode(); }} className="mt-8 space-y-5">
            <label className="block text-sm font-medium">
              Email address
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={emailOtpSent}
                className="mt-2 h-11 w-full border border-input bg-background px-3 text-sm disabled:bg-muted"
              />
              {!emailOtpSent && (
                <span className="mt-1 block text-xs text-muted-foreground">
                  We&apos;ll email the code and also attempt to send it by SMS to your registered phone.
                </span>
              )}
            </label>
            {emailOtpSent && <>{verificationCodeField}{passwordFields}</>}
            {message && <p role="status" className="text-sm text-brand-700">{message}</p>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button
              type={emailOtpSent ? "submit" : "button"}
              onClick={!emailOtpSent ? () => void sendEmailCode() : undefined}
              isLoading={loading}
              className="w-full"
            >
              {emailOtpSent ? "Reset password" : "Send verification code"}
            </Button>
            {emailOtpSent && (
              <>
                <button
                  type="button"
                  onClick={() => void sendEmailCode()}
                  disabled={loading || emailResendSeconds > 0}
                  className="w-full text-sm font-semibold text-brand-700 disabled:opacity-50"
                >
                  {emailResendSeconds > 0
                    ? `Resend code in 00:${String(emailResendSeconds).padStart(2, "0")}`
                    : "Resend code"}
                </button>
                {emailResendSeconds > 0 && (
                  <p role="status" className="text-center text-xs text-muted-foreground">
                    You can request another code in {emailResendSeconds} seconds.
                  </p>
                )}
              </>
            )}
          </form>
        ) : (
          <form onSubmit={resetWithPhone} className="mt-8 space-y-5">
            <label className="block text-sm font-medium">
              Mobile number
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                required
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                value={phone}
                onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
                disabled={phoneOtpSent}
                className="mt-2 h-11 w-full border border-input bg-background px-3 text-sm disabled:bg-muted"
              />
            </label>
            {phoneOtpSent && <>{verificationCodeField}{passwordFields}</>}
            {message && <p role="status" className="text-sm text-brand-700">{message}</p>}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button
              type={phoneOtpSent ? "submit" : "button"}
              onClick={!phoneOtpSent ? () => void sendPhoneCode() : undefined}
              isLoading={loading}
              className="w-full"
            >
              {phoneOtpSent ? "Reset password" : "Send verification code"}
            </Button>
            {phoneOtpSent && (
              <>
                <button
                  type="button"
                  onClick={() => void sendPhoneCode()}
                  disabled={loading || phoneResendSeconds > 0}
                  className="w-full text-sm font-semibold text-brand-700 disabled:opacity-50"
                >
                  {phoneResendSeconds > 0
                    ? `Resend code in 00:${String(phoneResendSeconds).padStart(2, "0")}`
                    : "Resend code"}
                </button>
                {phoneResendSeconds > 0 && (
                  <p role="status" className="text-center text-xs text-muted-foreground">
                    You can request another code in {phoneResendSeconds} seconds.
                  </p>
                )}
              </>
            )}
          </form>
        )}
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="font-semibold text-brand-700">Back to sign in</Link>
        </p>
      </section>
    </main>
  );
}
