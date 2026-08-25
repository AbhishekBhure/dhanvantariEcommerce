import type { Metadata } from "next";

export const metadata: Metadata = { title: "Frequently Asked Questions" };

const questions = [
  ["Are these real products?", "The current catalogue contains clearly marked demo data for development and review."],
  ["How can I track my order?", "Sign in and open Your orders from the account menu."],
  ["How can I contact the team?", "Visit the Contact Us page for the current support details."],
];

export default function FaqPage() {
  return <main className="section-container min-h-screen max-w-4xl py-12 md:py-20"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Help</p><h1 className="section-heading mt-3">Frequently asked questions</h1><div className="mt-10 divide-y divide-border border-y border-border">{questions.map(([question, answer]) => <details key={question} className="group py-5"><summary className="cursor-pointer list-none font-semibold">{question}</summary><p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{answer}</p></details>)}</div></main>;
}
