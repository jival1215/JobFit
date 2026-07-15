"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { JobMatchCard } from "@/components/JobMatchCard";
import { fetchSavedMatches, getAuthToken, type SavedMatchesResponse } from "@/lib/jobfit-api";
import type { JobMatch } from "@/lib/mock-data";

export function SavedJobsClient() {
  const [data, setData] = useState<SavedMatchesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("Saved");

  useEffect(() => {
    if (!getAuthToken()) {
      setLoading(false);
      setError("Sign in to view saved jobs.");
      return;
    }

    fetchSavedMatches()
      .then((result) => {
        setData(result);
        window.localStorage.setItem(
          "jobfit:ranked-results",
          JSON.stringify({ source: "Saved jobs", count: result.jobs.length, newCount: 0, jobs: result.jobs })
        );
        setError("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load saved jobs"))
      .finally(() => setLoading(false));
  }, []);

  const jobs = useMemo(() => data?.jobs ?? [], [data?.jobs]);
  const filtered = useMemo(() => {
    if (statusFilter === "All") return jobs;
    return jobs.filter((job) => (job.savedStatus || job.status || "Saved") === statusFilter);
  }, [jobs, statusFilter]);

  if (loading) {
    return (
      <section className="rounded-3xl border border-line bg-white p-8 shadow-sm">
        <p className="text-sm font-bold text-slateSoft">Loading saved jobs...</p>
      </section>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Sign in to view saved jobs"
        description="Saved jobs are connected to your JobFIT account, so sign in first and then save roles from your ranked matches."
        actionLabel="Sign in"
        actionHref="/account"
      />
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-[2rem] border border-line bg-white shadow-soft">
        <div className="grid gap-0 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="bg-ink p-8 text-white sm:p-10">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-300">Saved jobs</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Your short list.</h1>
            <p className="mt-4 max-w-2xl text-slate-300">
              Every role you save from a match card appears here, with the same feedback, apply link, and resume-tailoring guidance.
            </p>
          </div>
          <div className="p-8 sm:p-10">
            <p className="text-4xl font-black text-ink">{jobs.length}</p>
            <p className="mt-1 text-sm font-semibold text-slateSoft">Saved and tracked roles</p>
            <Link href="/dashboard" className="mt-5 inline-flex rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700">
              Back to matches
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col justify-between gap-4 rounded-3xl border border-line bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <p className="text-sm font-bold text-ink">Showing {filtered.length} of {jobs.length} saved jobs</p>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
        >
          <option>Saved</option>
          <option>Applied</option>
          <option>Skipped</option>
          <option>All</option>
        </select>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {filtered.length ? (
          filtered.map((job: JobMatch) => <JobMatchCard key={job.id || job.backendId} job={{ ...job, status: job.status || job.savedStatus || "Saved" }} />)
        ) : (
          <div className="lg:col-span-2">
            <EmptyState
              title="No saved jobs yet"
              description="Save jobs from your dashboard matches and they will show up here."
              actionLabel="Go to dashboard"
              actionHref="/dashboard"
            />
          </div>
        )}
      </div>
    </>
  );
}
