import Link from "next/link";
import type { JobMatch } from "@/lib/mock-data";
import { ApplyButton } from "./ApplyButton";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { SkillBadge } from "./SkillBadge";

export function JobMatchCard({ job }: { job: JobMatch }) {
  const detailHref = `/matches/${encodeURIComponent(job.id)}`;
  const applyHref = job.applyUrl || job.applicationLink;
  const matchedSkills = job.matchedSkills ?? [];
  const missingSkills = job.missingSkills ?? [];

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-line bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft">
      <Link href={detailHref} className="absolute inset-0 z-0" aria-label={`View feedback for ${job.title}`} />
      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slateSoft">
            {job.company} · {job.location}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-bold text-ink transition group-hover:text-brand-700">{job.title}</h3>
            {job.aiEnhanced ? (
              <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-violet-700 ring-1 ring-violet-200">
                Gemini-enhanced
              </span>
            ) : null}
          </div>
        </div>
        <MatchScoreBadge score={job.matchScore ?? job.score} recommendation={job.recommendation} />
      </div>

      <p className="relative z-10 mt-4 text-sm leading-6 text-slateSoft">
        {job.personalizedSummary || job.summary || "Open feedback to see why this job matched your resume."}
      </p>

      <div className="relative z-10 mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Matched</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {matchedSkills.length ? (
              matchedSkills.slice(0, 5).map((skill) => (
                <SkillBadge key={skill} tone="match">
                  {skill}
                </SkillBadge>
              ))
            ) : (
              <span className="text-sm text-slateSoft">No extracted matches yet.</span>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Missing</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {missingSkills.length ? (
              missingSkills.slice(0, 4).map((skill) => (
                <SkillBadge key={skill} tone="missing">
                  {skill}
                </SkillBadge>
              ))
            ) : (
              <span className="text-sm text-slateSoft">No major gaps found.</span>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-6 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-slate-500">
          {job.type} · {job.posted}
        </span>
        <div className="flex flex-wrap gap-3">
          <Link
            href={detailHref}
            className="rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-bold text-brand-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
          >
            View Feedback
          </Link>
          <ApplyButton href={applyHref} />
        </div>
      </div>
    </article>
  );
}
