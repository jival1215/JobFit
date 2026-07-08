import Link from "next/link";
import { MatchesClient } from "@/components/MatchesClient";
import { StatsCard } from "@/components/StatsCard";
import { jobMatches, stats } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-ink p-8 text-white shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">Dashboard</p>
        <div className="mt-4 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Your job search command center.</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Run a scan, review your ranked matches, filter opportunities, and open feedback for each job from one place.
            </p>
          </div>
          <Link href="/upload" className="rounded-full bg-white px-5 py-3 text-sm font-bold text-ink hover:bg-blue-50">
            Run new scan
          </Link>
        </div>
      </div>

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
