"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJobSources, type JobSourcesResponse } from "@/lib/jobfit-api";

function relativeTime(value: string) {
  if (!value) return "Waiting for first scan";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Recently checked";
  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function JobDatabaseStatus() {
  const [data, setData] = useState<JobSourcesResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJobSources()
      .then((result) => {
        setData(result);
        setError("");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load job source status"));
  }, []);

  const totals = useMemo(() => {
    const cache = data?.cache ?? [];
    const jobs = cache.reduce((sum, item) => sum + Number(item.jobCount || 0), 0);
    const latest = cache
      .map((item) => item.fetchedAt || item.updatedAt || "")
      .filter(Boolean)
      .sort()
      .at(-1) || "";
    return { jobs, latest };
  }, [data?.cache]);

  const ttlLabel = data
    ? data.cacheTtlMinutes >= 60
      ? `${Math.round(data.cacheTtlMinutes / 60)}h`
      : `${data.cacheTtlMinutes}m`
    : "";

  return (
    <section className="mt-8 rounded-3xl border border-line bg-white p-6 shadow-sm">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-brand-600">Job database</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Live sources with cached ranking speed.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slateSoft">
            Every scan searches all connected repos, then narrows by role and job type. Cached rows make scans faster while still refreshing on the backend schedule.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[460px]">
          {data ? (
            <>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-2xl font-black text-ink">{data.sources.length - 1}</p>
                <p className="mt-1 text-sm font-semibold text-slateSoft">Repos connected</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-2xl font-black text-ink">{totals.jobs || "No cache"}</p>
                <p className="mt-1 text-sm font-semibold text-slateSoft">Cached jobs</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-2xl font-black text-ink">{ttlLabel}</p>
                <p className="mt-1 text-sm font-semibold text-slateSoft">Refresh TTL</p>
              </div>
            </>
          ) : (
            [1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-line bg-slate-50 p-4 text-sm leading-6 text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span>{error ? error : `Last cached source refresh: ${relativeTime(totals.latest)}`}</span>
        <span className="font-bold text-ink">Default: {data?.defaultSource ?? "All job repos"}</span>
      </div>
    </section>
  );
}
