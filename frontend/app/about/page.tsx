import { FeatureCard } from "@/components/FeatureCard";
import { features } from "@/lib/mock-data";

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl bg-white p-8 shadow-soft ring-1 ring-line">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">About JobFIT</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-ink sm:text-6xl">
          A portfolio-ready AI product for smarter job applications.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-slateSoft">
          JobFIT helps students and job seekers upload a resume, compare it against job postings, and rank which jobs
          they should apply to first. The current frontend uses realistic mock data while staying structured for the
          existing Python resume extraction, SimplifyJobs parsing, matching, scout, tailoring, and tracker logic.
        </p>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
      <div className="mt-10 rounded-3xl border border-line bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-ink">Backend integration plan</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            "Expose Python matcher through a small API route or service.",
            "Send uploaded resume files to existing extraction utilities.",
            "Replace mock job data with ranked results from SimplifyJobs fetcher."
          ].map((item) => (
            <div key={item} className="rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-700">
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
