"use client";

import { useState } from "react";
import Link from "next/link";
import { getAuthToken, saveMatch } from "@/lib/jobfit-api";
import type { JobMatch } from "@/lib/mock-data";

const statuses = ["Saved", "Applied", "Skipped"];

export function SaveMatchControls({ job }: { job: JobMatch }) {
  const [current, setCurrent] = useState(job.status || "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState("");
  const hasToken = Boolean(getAuthToken());

  if (!hasToken) {
    return (
      <Link
        href="/account"
        className="rounded-full border border-line bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-ink"
      >
        Sign in to save
      </Link>
    );
  }

  async function updateStatus(status: string) {
    setLoading(status);
    setMessage("");
    try {
      await saveMatch(job, status);
      setCurrent(status);
      setMessage("Saved");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save");
    } finally {
      setLoading("");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {statuses.map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => updateStatus(status)}
          disabled={Boolean(loading)}
          className={`rounded-full px-3 py-2 text-xs font-black transition ${
            current === status
              ? "bg-ink text-white"
              : "border border-line bg-white text-slate-600 hover:bg-slate-50 hover:text-ink"
          }`}
        >
          {loading === status ? "..." : status}
        </button>
      ))}
      {message ? <span className="text-xs font-semibold text-slateSoft">{message}</span> : null}
    </div>
  );
}
