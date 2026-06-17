import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchScoreBadge } from "@/components/MatchScoreBadge";
import { SkillBadge } from "@/components/SkillBadge";
import { jobMatches } from "@/lib/mock-data";

type JobDetailsPageProps = {
  params: { id: string };
};

export function generateStaticParams() {
  return jobMatches.map((job) => ({ id: job.id }));
}

export default function JobDetailsPage({ params }: JobDetailsPageProps) {
  const job = jobMatches.find((item) => item.id === params.id);

  if (!job) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/matches" className="text-sm font-bold text-brand-600 hover:text-brand-700">
        Back to matches
      </Link>
      <div className="mt-6 rounded-3xl bg-ink p-8 text-white shadow-soft">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">{job.company}</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">{job.title}</h1>
            <p className="mt-4 text-slate-300">
              {job.location} · {job.type} · {job.posted}
            </p>
          </div>
          <MatchScoreBadge score={job.score} recommendation={job.recommendation} />
        </div>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
        <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-ink">Generated apply plan</h2>
          <p className="mt-4 text-sm leading-6 text-slateSoft">{job.summary}</p>
          <div className="mt-6 space-y-3">
            {job.improvements.map((item) => (
              <div key={item} className="rounded-2xl bg-slate-50 p-4 text-sm font-medium text-slate-700">
                {item}
              </div>
            ))}
          </div>
        </div>
        <aside className="space-y-6">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink">Matched skills</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {job.matchedSkills.map((skill) => (
                <SkillBadge key={skill} tone="match">
                  {skill}
                </SkillBadge>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink">Missing skills</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {job.missingSkills.map((skill) => (
                <SkillBadge key={skill} tone="missing">
                  {skill}
                </SkillBadge>
              ))}
            </div>
          </div>
          <button className="w-full rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700">
            Mark as saved
          </button>
        </aside>
      </div>
    </section>
  );
}
