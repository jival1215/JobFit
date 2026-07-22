import Link from "next/link";
import { LandingAccountCard } from "@/components/LandingAccountCard";

const productSignals = [
  "Resume-aware job ranking",
  "Saved resumes and matches",
  "Gemini recruiter feedback",
  "Live GitHub job sources",
];

const proofStats = [
  ["8", "connected job repos"],
  ["75", "ranked roles returned"],
  ["6h", "default source refresh"],
];

export default function LandingPage() {
  return (
    <section className="overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-16">
        <div className="flex flex-col justify-center">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-brand-600">AI job search workspace</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-tight text-ink sm:text-6xl lg:text-7xl">
            Apply first to the roles that actually fit.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slateSoft">
            JobFIT turns your resume into a ranked job search plan: real postings, matched skills, missing skills, recruiter-style feedback, and saved applications in one focused workspace.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/upload" className="rounded-full bg-brand-600 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-brand-700">
              Start matching
            </Link>
            <Link href="/about" className="rounded-full border border-line bg-white px-6 py-3 text-sm font-black text-ink shadow-sm transition hover:bg-slate-50">
              See how it works
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {productSignals.map((item) => (
              <div key={item} className="rounded-2xl border border-line bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 -z-10 translate-x-6 translate-y-6 rounded-[2.5rem] bg-ink" />
          <LandingAccountCard />
        </div>
      </div>

      <div className="border-y border-line bg-white/70">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-3 sm:px-6 lg:px-8">
          {proofStats.map(([value, label]) => (
            <div key={label} className="flex items-end gap-3">
              <p className="text-4xl font-black text-ink">{value}</p>
              <p className="pb-1 text-sm font-bold uppercase tracking-[0.14em] text-slateSoft">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
