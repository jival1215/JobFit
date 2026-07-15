import Link from "next/link";
import { DashboardAccountPanel } from "@/components/DashboardAccountPanel";
import { MatchesClient } from "@/components/MatchesClient";
import { StatsCard } from "@/components/StatsCard";
import { jobMatches, stats } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-line bg-white shadow-soft">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_.9fr]">
          <div className="bg-ink p-8 text-white sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-300">Dashboard</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Your job search command center.</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Reuse saved resumes, review ranked matches, track saved jobs, and open role-specific feedback from one focused workspace.
            </p>
          </div>
          <div className="flex flex-col justify-center gap-4 p-8 sm:p-10">
            <p className="text-sm leading-6 text-slateSoft">Sign in to reuse saved resumes and keep scan history, or run a fresh scan from an uploaded file.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/account" className="inline-flex w-fit rounded-full border border-line bg-white px-5 py-3 text-sm font-bold text-ink hover:bg-slate-50">
                Sign in
              </Link>
              <Link href="/upload" className="inline-flex w-fit rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700">
                Run scan
              </Link>
            </div>
          </div>
        </div>
      </div>

      <DashboardAccountPanel />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatsCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mt-12">
        <MatchesClient fallbackJobs={jobMatches} />
      </div>
    </section>
  );
}
