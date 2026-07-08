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
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  const [company, setCompany] = useState("");
  const [minimum, setMinimum] = useState("70");

  useEffect(() => {
    const saved = window.localStorage.getItem("jobfit:ranked-results");
    if (saved) {
      setRanked(JSON.parse(saved) as RankResponse);
    }
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
      const matchesScore = job.score >= Number(minimum);
      return matchesRole && matchesLocation && matchesCompany && matchesScore;
    });
  }, [jobs, role, location, company, minimum]);

  return (
    <>
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">Ranked matches</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-ink sm:text-6xl">Apply-first job list.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slateSoft">
            {ranked
              ? `Showing live SimplifyJobs results from ${ranked.source}${fetchedLabel ? `, refreshed ${fetchedLabel}` : ""}. ${ranked.newCount} jobs were new in this scan.`
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
                : "Gemini was requested, but the backend API key is not enabled"}
            </p>
          ) : null}
        </div>
        <div className="rounded-2xl border border-line bg-white p-4 text-sm text-slate-600 shadow-sm">
          <p className="font-semibold text-ink">Showing {filtered.length} of {jobs.length} matches</p>
          {ranked?.sourceUrl ? (
            <a
              href={ranked.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block truncate text-brand-600 hover:text-brand-700"
            >
              Live source repo
            </a>
          ) : null}
        </div>
      </div>
      <div className="mt-8 rounded-3xl border border-line bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
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
