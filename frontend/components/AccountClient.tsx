"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  clearAuthToken,
  fetchAccount,
  getAuthToken,
  loginAccount,
  logoutAccount,
  registerAccount,
  setAuthToken,
  type AccountResponse,
} from "@/lib/jobfit-api";

export function AccountClient() {
  const [mode, setMode] = useState<"login" | "register">("login");
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
  }, []);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const result = mode === "register" ? await registerAccount(email, password, firstName, lastName) : await loginAccount(email, password);
      setAuthToken(result.token);
      setHasCheckedAccount(false);
      setAccount(await fetchAccount());
      setHasCheckedAccount(true);
      setPassword("");
      setFirstName("");
      setLastName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to continue");
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    await logoutAccount();
    clearAuthToken();
    setAccount(null);
    setHasCheckedAccount(true);
  }

  if (!hasCheckedAccount) {
    return (
      <section className="mx-auto max-w-xl rounded-3xl border border-line bg-white p-8 shadow-soft">
        <div className="h-4 w-24 animate-pulse rounded-full bg-brand-100" />
        <div className="mt-5 h-10 w-3/4 animate-pulse rounded-2xl bg-slate-100" />
        <div className="mt-4 h-4 w-full animate-pulse rounded-full bg-slate-100" />
        <div className="mt-3 h-4 w-2/3 animate-pulse rounded-full bg-slate-100" />
        <div className="mt-8 h-12 animate-pulse rounded-full bg-slate-100" />
        <div className="mt-6 h-12 animate-pulse rounded-2xl bg-slate-100" />
        <div className="mt-4 h-12 animate-pulse rounded-2xl bg-slate-100" />
      </section>
    );
  }

  if (account) {
    const summary = account.summary ?? {};
    return (
      <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
        <section className="rounded-3xl bg-ink p-8 text-white shadow-soft">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-300">Signed in</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight">{account.user.displayName || account.user.email}</h1>
          <p className="mt-4 text-sm leading-6 text-white/70">
            Your account stores saved jobs, resume records, and scan history. Your data is stored through the JobFIT backend and Supabase persistence layer.
          </p>
          <button
            type="button"
            onClick={signOut}
            className="mt-6 rounded-full bg-white px-5 py-3 text-sm font-bold text-ink transition hover:bg-brand-50"
          >
            Sign out
          </button>
        </section>

        <section className="rounded-3xl border border-line bg-white p-8 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">Saved workflow</p>
              <h2 className="mt-2 text-2xl font-black text-ink">Your JobFIT workspace</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/saved" className="rounded-full border border-line bg-white px-5 py-3 text-sm font-bold text-ink hover:bg-slate-50">
                Saved jobs
              </Link>
              <Link href="/dashboard" className="rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700">
                View dashboard
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-5">
            {["Saved", "Applied", "Skipped", "Match runs", "Resumes"].map((key) => (
              <div key={key} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-2xl font-black text-ink">{summary[key] ?? 0}</p>
                <p className="mt-1 text-sm font-semibold text-slateSoft">{key}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-lg font-black text-ink">Recent scans</h3>
              <div className="mt-4 space-y-3">
                {account.matchRuns?.length ? (
                  account.matchRuns.map((run) => (
                    <div key={String(run.id)} className="rounded-2xl border border-line p-4 text-sm leading-6 text-slate-700">
                      <p className="font-bold text-ink">{String(run.source)} · {String(run.count)} jobs</p>
                      <p>{String(run.fetchedAt || run.createdAt || "Recent scan")}</p>
                      {run.resumeId ? <p className="text-xs font-semibold text-slateSoft">Resume #{String(run.resumeId)}</p> : null}
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slateSoft">No saved scans yet. Run a resume scan while signed in to store match history.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-black text-ink">Stored resumes</h3>
              <div className="mt-4 space-y-3">
                {account.resumes?.length ? (
                  account.resumes.map((resume) => (
                    <div key={resume.id} className="rounded-2xl border border-line p-4 text-sm leading-6 text-slate-700">
                      <p className="font-bold text-ink">{resume.filename}</p>
                      <p>{Math.max(1, Math.round(resume.fileSize / 1024))}KB · {resume.encrypted ? "Encrypted" : "Stored without app encryption key"}</p>
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slateSoft">No resume records yet. Upload while signed in to store one.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-line bg-white p-8 shadow-soft">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">Account</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-ink">Save matches across sessions.</h1>
      <p className="mt-4 text-sm leading-6 text-slateSoft">
        Create a JobFIT account to store resume records, match runs, recommendations, and saved/applied/skipped jobs. This is the foundation for AWS Cognito and managed storage.
      </p>

      <div className="mt-6 flex rounded-full bg-slate-100 p-1">
        {(["login", "register"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-bold transition ${mode === item ? "bg-white text-ink shadow-sm" : "text-slateSoft"}`}
          >
            {item === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      {mode === "register" ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-ink">First name</span>
            <input
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
              placeholder="First name"
              type="text"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-ink">Last name</span>
            <input
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
              placeholder="Last name"
              type="text"
            />
          </label>
        </div>
      ) : null}

      <label className={mode === "register" ? "mt-4 block" : "mt-6 block"}>
        <span className="text-sm font-semibold text-ink">Email</span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
          placeholder="you@example.com"
          type="email"
        />
      </label>
      <label className="mt-4 block">
        <span className="text-sm font-semibold text-ink">Password</span>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
          placeholder="At least 8 characters"
          type="password"
        />
      </label>
      {error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="mt-6 w-full rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {loading ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
      </button>
    </section>
  );
}
