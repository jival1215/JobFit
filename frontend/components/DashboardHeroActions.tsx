"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AUTH_CHANGED_EVENT, fetchAccount, getAuthToken, type AccountResponse } from "@/lib/jobfit-api";

function displayName(account: AccountResponse | null) {
  return account?.user.displayName || account?.user.firstName || account?.user.email || "your account";
}

export function DashboardHeroActions() {
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [hasCheckedAccount, setHasCheckedAccount] = useState(false);

  async function loadAccount() {
    if (!getAuthToken()) {
      setAccount(null);
      setHasCheckedAccount(true);
      return;
    }

    try {
      setAccount(await fetchAccount());
    } catch {
      setAccount(null);
    } finally {
      setHasCheckedAccount(true);
    }
  }

  useEffect(() => {
    loadAccount();
    window.addEventListener(AUTH_CHANGED_EVENT, loadAccount);
    window.addEventListener("storage", loadAccount);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, loadAccount);
      window.removeEventListener("storage", loadAccount);
    };
  }, []);

  if (!hasCheckedAccount) {
    return (
      <div className="flex flex-col justify-center gap-4 p-8 sm:p-10">
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-slate-100" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-100" />
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="h-12 w-28 animate-pulse rounded-full bg-slate-100" />
          <div className="h-12 w-32 animate-pulse rounded-full bg-brand-100" />
        </div>
      </div>
    );
  }

  if (account) {
    return (
      <div className="flex flex-col justify-center gap-4 p-8 sm:p-10">
        <p className="text-sm leading-6 text-slateSoft">
          You are signed in as <span className="font-bold text-ink">{displayName(account)}</span>. Run a fresh scan, reuse saved resumes, or open your saved jobs.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/upload" className="inline-flex w-fit rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700">
            Run scan
          </Link>
          <Link href="/saved" className="inline-flex w-fit rounded-full border border-line bg-white px-5 py-3 text-sm font-bold text-ink hover:bg-slate-50">
            Saved jobs
          </Link>
          <Link href="/account" className="inline-flex w-fit rounded-full border border-line bg-white px-5 py-3 text-sm font-bold text-ink hover:bg-slate-50">
            Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center gap-4 p-8 sm:p-10">
      <p className="text-sm leading-6 text-slateSoft">Sign in to reuse saved resumes and keep scan history, or run a fresh scan from an uploaded file.</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/account" className="inline-flex w-fit rounded-full border border-line bg-white px-5 py-3 text-sm font-bold text-ink hover:bg-slate-50">
          Sign in
        </Link>
        <Link href="/upload" className="inline-flex w-fit rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700">
          Run scan
        </Link>
        <Link href="/saved" className="inline-flex w-fit rounded-full border border-line bg-white px-5 py-3 text-sm font-bold text-ink hover:bg-slate-50">
          Saved jobs
        </Link>
      </div>
    </div>
  );
}
