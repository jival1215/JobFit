import Link from "next/link";
import { FeatureCard } from "@/components/FeatureCard";
import { Hero } from "@/components/Hero";
import { JobMatchCard } from "@/components/JobMatchCard";
import { StatsCard } from "@/components/StatsCard";
import { features, jobMatches, stats } from "@/lib/mock-data";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatsCard key={stat.label} {...stat} />
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">Workflow</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              From resume upload to apply-first list.
            </h2>
          </div>
          <Link
            href="/upload"
            className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Try the flow
          </Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">Preview</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-ink">Example ranked matches</h2>
          </div>
          <Link href="/dashboard" className="hidden text-sm font-bold text-brand-600 hover:text-brand-700 sm:block">
            Open dashboard
          </Link>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {jobMatches.slice(0, 2).map((job) => (
            <JobMatchCard key={job.id} job={job} />
          ))}
        </div>
      </section>
    </>
  );
}
