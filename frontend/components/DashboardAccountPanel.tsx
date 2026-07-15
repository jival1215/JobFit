"use client";

import { useEffect, useState } from "react";
import {
  fetchAccount,
  getAuthToken,
  loginAccount,
  logoutAccount,
  registerAccount,
  setAuthToken,
  clearAuthToken,
  type AccountResponse,
} from "@/lib/jobfit-api";

export function DashboardAccountPanel({ compact = false }: { compact?: boolean }) {
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
      <section className={`${compact ? "" : "mt-8"} rounded-3xl border border-line bg-white p-6 shadow-sm`}>
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex-1">
            <div className="h-4 w-24 animate-pulse rounded-full bg-brand-100" />
            <div className="mt-4 h-8 w-2/3 animate-pulse rounded-2xl bg-slate-100" />
            <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="h-12 w-28 animate-pulse rounded-full bg-slate-100" />
        </div>
      </section>
    );
  }

  if (account) {
    const summary = account.summary ?? {};
    return (
      <section className={`${compact ? "" : "mt-8"} rounded-3xl border border-line bg-white p-6 shadow-sm`}>
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">Account</p>
            <h2 className="mt-2 text-2xl font-black text-ink">Signed in as {account.user.displayName || account.user.email}</h2>
            <p className="mt-2 text-sm leading-6 text-slateSoft">
              Saved jobs, scan history, and uploaded resume records are stored behind your signed-in JobFIT account.
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="rounded-full border border-line bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-ink"
          >
            Sign out
          </button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-5">
          {["Saved", "Applied", "Skipped", "Match runs", "Resumes"].map((key) => (
            <div key={key} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-2xl font-black text-ink">{summary[key] ?? 0}</p>
              <p className="mt-1 text-sm font-semibold text-slateSoft">{key}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={`${compact ? "" : "mt-8"} rounded-3xl border border-brand-100 bg-white p-6 shadow-sm`}>
      <div className="grid gap-6 lg:grid-cols-[.9fr_1.1fr] lg:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">Account</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Sign in to save matches and scan history.</h2>
          <p className="mt-2 text-sm leading-6 text-slateSoft">
            You can browse demo matches without an account, but signing in lets JobFIT store resumes, saved jobs, and recommendation history for your workflow.
          </p>
        </div>
        <div>
          <div className="flex rounded-full bg-slate-100 p-1">
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
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
                placeholder="First name"
                type="text"
              />
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
                placeholder="Last name"
                type="text"
              />
            </div>
          ) : null}
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
              placeholder="Email"
              type="email"
            />
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="rounded-2xl border border-line px-4 py-3 text-sm outline-none focus:border-brand-500"
              placeholder="Password"
              type="password"
            />
            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? "..." : mode === "login" ? "Sign in" : "Create"}
            </button>
          </div>
          {error ? <p className="mt-3 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}
