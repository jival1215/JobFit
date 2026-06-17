import Link from "next/link";
import { JobMatchCard } from "@/components/JobMatchCard";
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
              Monitor scanned jobs, apply-first matches, saved roles, and follow-up work from one clean overview.
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
      <div className="mt-12 grid gap-8 lg:grid-cols-[1.4fr_.8fr]">
        <div>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-ink">Top matches</h2>
            <Link href="/matches" className="text-sm font-bold text-brand-600 hover:text-brand-700">
              See matches
            </Link>
          </div>
          <div className="space-y-5">
            {jobMatches.slice(0, 3).map((job) => (
              <JobMatchCard key={job.id} job={job} />
            ))}
          </div>
        </div>
        <aside className="rounded-3xl border border-line bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-ink">Next actions</h2>
          <div className="mt-6 space-y-4">
            {[
              "Tailor resume for Pfizer AI Data Science Intern",
              "Follow up on two applied roles this week",
              "Add Spark or Databricks project note",
              "Export ranked matches CSV"
            ].map((item) => (
              <div key={item} className="rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
