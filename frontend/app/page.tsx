import Link from "next/link";
import { DashboardAccountPanel } from "@/components/DashboardAccountPanel";

export default function LandingPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-line bg-white shadow-soft">
        <div className="grid gap-0 lg:grid-cols-[.95fr_1.05fr]">
          <div className="bg-ink p-8 text-white sm:p-10 lg:p-12">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-300">JobFIT</p>
            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">Sign in, then scan every job source.</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Start from your account so saved resumes, saved jobs, Gemini feedback, and scan history are ready before you move around the app.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/upload" className="rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700">
                Upload resume
              </Link>
              <Link href="/dashboard" className="rounded-full border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                Open dashboard
              </Link>
            </div>
          </div>
          <div className="p-6 sm:p-8 lg:p-10">
            <DashboardAccountPanel compact />
          </div>
        </div>
      </div>
    </section>
  );
}
