import Link from "next/link";
import type { JobMatch } from "@/lib/mock-data";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { SkillBadge } from "./SkillBadge";

export function JobMatchCard({ job }: { job: JobMatch }) {
  return (
    <article className="rounded-3xl border border-line bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slateSoft">
            {job.company} · {job.location}
          </p>
          <h3 className="mt-2 text-xl font-bold text-ink">{job.title}</h3>
        </div>
        <MatchScoreBadge score={job.score} recommendation={job.recommendation} />
      </div>
      <p className="mt-4 text-sm leading-6 text-slateSoft">{job.summary}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {job.matchedSkills.slice(0, 5).map((skill) => (
          <SkillBadge key={skill} tone="match">
            {skill}
          </SkillBadge>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
        <span className="text-sm text-slate-500">
          {job.type} · {job.posted}
        </span>
        <Link href={`/matches/${job.id}`} className="text-sm font-bold text-brand-600 transition hover:text-brand-700">
          View apply plan
        </Link>
      </div>
    </article>
  );
}
