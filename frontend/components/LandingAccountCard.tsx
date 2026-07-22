"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AUTH_CHANGED_EVENT,
  fetchAccount,
  getAuthToken,
  loginAccount,
  registerAccount,
  setAuthToken,
  type AccountResponse,
} from "@/lib/jobfit-api";

function userLabel(account: AccountResponse | null) {
  return account?.user.firstName || account?.user.displayName || account?.user.email || "there";
}

export function LandingAccountCard() {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [hasCheckedAccount, setHasCheckedAccount] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadAccount() {
    if (!getAuthToken()) {
      setAccount(null);
      setHasCheckedAccount(true);
      return;
    }

    try {
      setAccount(await fetchAccount());
      setError("");
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

  async function submit() {
    setLoading(true);
    setError("");

    try {
      const result = mode === "register"
        ? await registerAccount(email, password, firstName, lastName)
        : await loginAccount(email, password);
      setAuthToken(result.token);
      setAccount(await fetchAccount());
      setPassword("");
      setFirstName("");
      setLastName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to continue");
    } finally {
      setLoading(false);
    }
  }

  if (!hasCheckedAccount) {
    return (
      <div className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-soft backdrop-blur">
        <div className="h-4 w-28 animate-pulse rounded-full bg-brand-100" />
        <div className="mt-5 h-10 w-3/4 animate-pulse rounded-2xl bg-slate-100" />
        <div className="mt-6 h-12 animate-pulse rounded-2xl bg-slate-100" />
        <div className="mt-4 h-12 animate-pulse rounded-2xl bg-slate-100" />
        <div className="mt-6 h-12 animate-pulse rounded-full bg-brand-100" />
      </div>
    );
  }

  if (account) {
    const summary = account.summary ?? {};
    return (
      <div className="rounded-[2rem] border border-white/60 bg-white/95 p-6 shadow-soft backdrop-blur">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Welcome back</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-ink">Ready when you are, {userLabel(account)}.</h2>
        <p className="mt-3 text-sm leading-6 text-slateSoft">
          Your resumes, saved jobs, and scan history are already connected. Start with a fresh scan or pick up where you left off.
        </p>
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            ["Saved", summary.Saved ?? 0],
            ["Runs", summary["Match runs"] ?? 0],
            ["Resumes", summary.Resumes ?? 0],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-2xl font-black text-ink">{value}</p>
              <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-slateSoft">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/upload" className="rounded-full bg-brand-600 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-brand-700">
            Run a scan
          </Link>
          <Link href="/dashboard" className="rounded-full border border-line bg-white px-5 py-3 text-center text-sm font-bold text-ink transition hover:bg-slate-50">
            Open dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border border-white/60 bg-white/95 p-6 shadow-soft backdrop-blur">
      <div className="flex rounded-full bg-slate-100 p-1">
        {(["register", "login"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-black transition ${mode === item ? "bg-white text-ink shadow-sm" : "text-slateSoft"}`}
          >
            {item === "register" ? "Create account" : "Sign in"}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Start free</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-ink">
          {mode === "register" ? "Create your JobFIT workspace." : "Welcome back to JobFIT."}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slateSoft">
          {mode === "register"
            ? "Save resumes, keep ranked matches, and track every job from one account."
            : "Sign in to reuse your resumes and continue your application list."}
        </p>
      </div>

      {mode === "register" ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <input value={firstName} onChange={(event) => setFirstName(event.target.value)} className="rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-500" placeholder="First name" type="text" />
          <input value={lastName} onChange={(event) => setLastName(event.target.value)} className="rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-500" placeholder="Last name" type="text" />
        </div>
      ) : null}

      <div className="mt-3 grid gap-3">
        <input value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-500" placeholder="Email" type="email" />
        <input value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-500" placeholder="Password" type="password" />
      </div>

      {error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}

      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="mt-5 w-full rounded-full bg-brand-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Working..." : mode === "register" ? "Create account" : "Sign in"}
      </button>
      <p className="mt-4 text-center text-xs font-semibold text-slateSoft">
        Your resume data is stored behind your JobFIT account through the backend, not exposed directly to the browser.
      </p>
    </div>
  );
}
