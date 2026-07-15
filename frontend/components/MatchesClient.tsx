"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { JobMatchCard } from "@/components/JobMatchCard";
import type { JobMatch } from "@/lib/mock-data";
import type { RankResponse } from "@/lib/jobfit-api";

type MatchesClientProps = {
  fallbackJobs: JobMatch[];
};

export function MatchesClient({ fallbackJobs }: MatchesClientProps) {
  const [ranked, setRanked] = useState<RankResponse | null>(null);
  const [hasLoadedSavedResults, setHasLoadedSavedResults] = useState(false);
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [company, setCompany] = useState("");
  const [jobType, setJobType] = useState("");
  const [minimum, setMinimum] = useState("70");

  useEffect(() => {
    const saved = window.localStorage.getItem("jobfit:ranked-results");
    if (saved) {
      try {
        setRanked(JSON.parse(saved) as RankResponse);
      } catch {
        setRanked(null);
      }
    }
    setHasLoadedSavedResults(true);
  }, []);

  const jobs = ranked?.jobs ?? fallbackJobs;
  const fetchedLabel = ranked?.fetchedAt
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(ranked.fetchedAt))
    : "";
  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      const matchesRole = role ? job.title.toLowerCase().includes(role.toLowerCase()) : true;
      const matchesLocation = location ? job.location.toLowerCase().includes(location.toLowerCase()) : true;
      const matchesCompany = company ? job.company.toLowerCase().includes(company.toLowerCase()) : true;
      const matchesType = jobType ? job.type === jobType : true;
      const matchesScore = job.score >= Number(minimum);
      return matchesRole && matchesLocation && matchesCompany && matchesType && matchesScore;
    });
  }, [jobs, role, location, company, jobType, minimum]);

  if (!hasLoadedSavedResults) {
    return (
      <section className="rounded-[2rem] border border-line bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="h-4 w-36 animate-pulse rounded-full bg-brand-100" />
            <div className="mt-5 h-12 w-3/4 animate-pulse rounded-2xl bg-slate-100" />
            <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-slate-100" />
            <div className="mt-3 h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="h-20 w-full animate-pulse rounded-2xl bg-slate-100 md:w-64" />
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-5">
          {["Role", "Location", "Company", "Type", "Score"].map((item) => (
            <div key={item} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-64 animate-pulse rounded-3xl bg-slate-100" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">Ranked matches</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-ink sm:text-6xl">Apply-first job list.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slateSoft">
            {ranked
              ? `Showing ranked results from all connected repos${fetchedLabel ? `, refreshed ${fetchedLabel}` : ""}. Scanned ${ranked.count} jobs and returned the top ${ranked.returnedCount ?? ranked.jobs.length}.`
              : "No backend scan is loaded yet, so this page is showing realistic mock matches."}
          </p>
          {ranked?.aiRecommendationsRequested ? (
            <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-bold ${
              ranked.aiRecommendationsEnabled
                ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200"
                : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
            }`}>
              {ranked.aiRecommendationsEnabled
                ? `Gemini reviewed ${ranked.aiRecruiterReviewedCount ?? 0} candidates and enhanced recommendation text for ${ranked.aiEnhancedCount ?? 0} top matches`
                : ranked.aiError
                  ? `Gemini was requested but skipped: ${ranked.aiError}`
                  : "Gemini was requested, but the backend API key is not enabled"}
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-line bg-white p-4 text-sm text-slate-600 shadow-sm">
          <p className="font-semibold text-ink">Showing {filtered.length} of {jobs.length} returned matches</p>
          <p className="mt-1 text-slateSoft">{ranked ? `${ranked.count} total jobs scanned` : "Demo result set"}</p>
        </div>
      </div>
      <div className="mt-8 rounded-3xl border border-line bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-5">
          <input
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
            placeholder="Role"
          />
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
            placeholder="Location"
          />
          <input
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            className="rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
            placeholder="Company"
          />
          <select
            value={jobType}
            onChange={(event) => setJobType(event.target.value)}
            className="rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
          >
            <option value="">All job types</option>
            <option value="Internship">Internship</option>
            <option value="Co-op">Co-op</option>
            <option value="Full-Time">Full-Time</option>
          </select>
          <select
            value={minimum}
            onChange={(event) => setMinimum(event.target.value)}
            className="rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
          >
            <option value="0">Minimum score: 0+</option>
            <option value="60">Minimum score: 60+</option>
            <option value="70">Minimum score: 70+</option>
            <option value="80">Minimum score: 80+</option>
            <option value="90">Minimum score: 90+</option>
          </select>
        </div>
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {filtered.length ? (
          filtered.map((job) => <JobMatchCard key={job.id} job={job} />)
        ) : (
          <div className="lg:col-span-2">
            <EmptyState
              title="No matches found"
              description="Try lowering the score threshold or clearing one of the filters."
              actionLabel="Upload resume"
              actionHref="/upload"
            />
          </div>
        )}
      </div>
    </>
  );
}
