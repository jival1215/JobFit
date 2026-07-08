"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  clearAuthToken,
  fetchAccount,
  loginAccount,
  logoutAccount,
  registerAccount,
  setAuthToken,
  type AccountResponse,
} from "@/lib/jobfit-api";

export function AccountClient() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadAccount() {
    try {
      setAccount(await fetchAccount());
      setError("");
    } catch {
      setAccount(null);
    }
  }

  useEffect(() => {
    loadAccount();
  }, []);

  async function submit() {
    setLoading(true);
    setError("");
    try {
      const result = mode === "register" ? await registerAccount(email, password) : await loginAccount(email, password);
      setAuthToken(result.token);
      setAccount(await fetchAccount());
      setPassword("");
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
  }

  if (account) {
    const summary = account.summary ?? {};
    return (
      <div className="grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
        <section className="rounded-3xl bg-ink p-8 text-white shadow-soft">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-300">Signed in</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight">{account.user.email}</h1>
          <p className="mt-4 text-sm leading-6 text-white/70">
            Your account is backed by the local JobFIT SQLite database. This is the local version of the AWS user-account flow.
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
              <h2 className="mt-2 text-2xl font-black text-ink">Your local job database</h2>
            </div>
            <Link href="/dashboard" className="rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700">
              View dashboard
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            {["Saved", "Applied", "Skipped", "Match runs"].map((key) => (
              <div key={key} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-2xl font-black text-ink">{summary[key] ?? 0}</p>
                <p className="mt-1 text-sm font-semibold text-slateSoft">{key}</p>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-black text-ink">Recent scans</h3>
            <div className="mt-4 space-y-3">
              {account.matchRuns?.length ? (
                account.matchRuns.map((run) => (
                  <div key={String(run.id)} className="rounded-2xl border border-line p-4 text-sm leading-6 text-slate-700">
                    <p className="font-bold text-ink">{String(run.source)} · {String(run.count)} jobs</p>
                    <p>{String(run.fetchedAt || run.createdAt || "Recent scan")}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slateSoft">No saved scans yet. Run a resume scan while signed in to store match history.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-line bg-white p-8 shadow-soft">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">Local account</p>
      <h1 className="mt-3 text-4xl font-black tracking-tight text-ink">Save matches across sessions.</h1>
      <p className="mt-4 text-sm leading-6 text-slateSoft">
        Create a local JobFIT account to store match runs and saved/applied/skipped jobs in SQLite. This is the local foundation for AWS Cognito and RDS later.
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

      <label className="mt-6 block">
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
