import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.38),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.22),transparent_30%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1.15fr_.85fr] lg:px-8 lg:py-28">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">AI job-matching workspace</p>
          <h1 className="mt-6 max-w-4xl text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
            Know which jobs are worth applying to first.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Upload a resume, compare it with real postings, and rank opportunities by recruiter-fit score, matched
            skills, missing skills, and suggested improvements.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/upload"
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-ink shadow-sm transition hover:bg-blue-50"
            >
              Upload resume
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-white/20 px-6 py-3 text-sm font-bold text-white transition hover:border-white/50 hover:bg-white/10"
            >
              View demo matches
            </Link>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-2xl backdrop-blur">
          <div className="rounded-2xl bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slateSoft">Top recommendation</p>
                <h2 className="mt-1 text-xl font-bold text-ink">Pfizer · AI Data Science Intern</h2>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200">
                93%
              </span>
            </div>
            <div className="mt-6 space-y-3">
              {["Python + SQL match", "AI document intelligence project", "Healthcare/pharma context"].map((item) => (
                <div key={item} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-brand-50 p-4 text-sm leading-6 text-brand-700">
              Lead with the Pfizer AI document intelligence project and mirror the posting language around document
              workflows, retrieval, and analytics.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
