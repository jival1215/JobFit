import { DashboardAccountPanel } from "@/components/DashboardAccountPanel";
import { MatchesClient } from "@/components/MatchesClient";
import { DashboardStatsClient } from "@/components/DashboardStatsClient";
import { DashboardHeroActions } from "@/components/DashboardHeroActions";
import { JobDatabaseStatus } from "@/components/JobDatabaseStatus";
import { jobMatches } from "@/lib/mock-data";

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
          <DashboardHeroActions />
        </div>
      </div>

      <DashboardAccountPanel />

      <JobDatabaseStatus />

      <DashboardStatsClient fallbackJobs={jobMatches} />

      <div className="mt-12">
        <MatchesClient fallbackJobs={jobMatches} />
      </div>
    </section>
  );
}
