"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchSavedMatches, getAuthToken, type RankResponse } from "@/lib/jobfit-api";
import { StatsCard } from "@/components/StatsCard";
import type { JobMatch } from "@/lib/mock-data";

type DashboardStatsClientProps = {
  fallbackJobs: JobMatch[];
};

function averageTopScore(jobs: JobMatch[]) {
  const top = [...jobs].sort((a, b) => b.score - a.score).slice(0, 10);
  if (!top.length) return 0;
  return Math.round(top.reduce((sum, job) => sum + job.score, 0) / top.length);
}

export function DashboardStatsClient({ fallbackJobs }: DashboardStatsClientProps) {
  const [ranked, setRanked] = useState<RankResponse | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("jobfit:ranked-results");
    if (saved) {
      try {
        setRanked(JSON.parse(saved) as RankResponse);
      } catch {
        setRanked(null);
      }
    }

    if (getAuthToken()) {
      fetchSavedMatches()
        .then((result) => setSavedCount(result.summary?.Saved ?? result.jobs.length))
        .catch(() => setSavedCount(null));
    }
  }, []);

  const jobs = ranked?.jobs ?? fallbackJobs;
  const applyFirst = jobs.filter((job) => job.recommendation === "Apply" || job.score >= 78).length;
  const stats = useMemo(
    () => [
      {
        label: "Jobs scanned",
        value: ranked ? String(ranked.count) : "Demo",
        detail: ranked ? `All connected repos; showing top ${ranked.returnedCount ?? jobs.length}` : "Run a scan to replace demo data",
      },
      {
        label: "Apply-first matches",
        value: String(applyFirst),
        detail: ranked ? "Apply-ranked jobs in current results" : "Demo matches only",
      },
      {
        label: "Avg top score",
        value: String(averageTopScore(jobs)),
        detail: "Average score across the top 10 shown",
      },
      {
        label: "Saved jobs",
        value: savedCount === null ? String(ranked?.tracker?.Saved ?? 0) : String(savedCount),
        detail: getAuthToken() ? "Stored in your JobFIT account" : "Sign in to store saved jobs",
      },
    ],
    [applyFirst, jobs, ranked, savedCount]
  );

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <StatsCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
