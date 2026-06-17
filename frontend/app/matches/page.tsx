import { EmptyState } from "@/components/EmptyState";
import { JobMatchCard } from "@/components/JobMatchCard";
import { jobMatches } from "@/lib/mock-data";

export default function MatchesPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">Ranked matches</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-ink sm:text-6xl">Apply-first job list.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slateSoft">
            Ranked by recruiter fit, matched skills, missing skills, role alignment, location preference, and freshness.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-4 text-sm text-slate-600 shadow-sm">
          Showing {jobMatches.length} mock matches
        </div>
      </div>
      <div className="mt-8 rounded-3xl border border-line bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          <input className="rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-500" placeholder="Role" />
          <input className="rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-500" placeholder="Location" />
          <input className="rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-500" placeholder="Company" />
          <select className="rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-500">
            <option>Minimum score: 70+</option>
            <option>Minimum score: 80+</option>
            <option>Minimum score: 90+</option>
          </select>
        </div>
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {jobMatches.length ? (
          jobMatches.map((job) => <JobMatchCard key={job.id} job={job} />)
        ) : (
          <div className="lg:col-span-2">
            <EmptyState
              title="No matches yet"
              description="Upload a resume and run a scan to generate ranked matches."
              actionLabel="Upload resume"
              actionHref="/upload"
            />
          </div>
        )}
      </div>
    </section>
  );
}
