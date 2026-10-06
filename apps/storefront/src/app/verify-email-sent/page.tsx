import Link from "next/link";

export default function VerifyEmailSentPage() {
  return (
    <main className="section-container flex min-h-[70vh] items-center justify-center py-16">
      <section className="w-full max-w-lg border border-border px-6 py-12 text-center">
        <h1 className="section-heading">Check your email</h1>
        <p className="mt-4 text-muted-foreground">We sent a verification link to the address you registered. Open it to verify your account, then sign in.</p>
        <Link href="/login" className="mt-8 inline-flex h-11 items-center justify-center bg-brand-600 px-6 text-sm font-semibold text-white">Go to sign in</Link>
      </section>
    </main>
  );
}
