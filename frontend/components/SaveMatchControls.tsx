"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AUTH_CHANGED_EVENT, getAuthToken, saveMatch } from "@/lib/jobfit-api";
import type { JobMatch } from "@/lib/mock-data";

export function SaveMatchControls({ job }: { job: JobMatch }) {
  const initialStatus = job.status || job.savedStatus || "";
  const [current, setCurrent] = useState(initialStatus);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    function syncAuthState() {
      setHasToken(Boolean(getAuthToken()));
    }

    syncAuthState();
    window.addEventListener(AUTH_CHANGED_EVENT, syncAuthState);
    window.addEventListener("storage", syncAuthState);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuthState);
      window.removeEventListener("storage", syncAuthState);
    };
  }, []);

  useEffect(() => {
    setCurrent(job.status || job.savedStatus || "");
  }, [job.savedStatus, job.status]);

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

  async function saveJob() {
    if (current === "Saved") return;
    setLoading(true);
    setMessage("");
    try {
      await saveMatch(job, "Saved");
      setCurrent("Saved");
      setMessage("Added to saved jobs");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not save");
    } finally {
      setLoading(false);
    }
  }

  const isSaved = current === "Saved";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={saveJob}
        disabled={loading || isSaved}
        className={`rounded-full px-4 py-2 text-sm font-black transition ${
          isSaved
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
            : "border border-line bg-white text-slate-700 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
        } disabled:cursor-default`}
      >
        {loading ? "Saving..." : isSaved ? "Saved" : "Save"}
      </button>
      {message ? <span className="text-xs font-semibold text-slateSoft">{message}</span> : null}
    </div>
  );
}
