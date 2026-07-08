"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { ApplyButton } from "@/components/ApplyButton";
import { EmptyState } from "@/components/EmptyState";
import { MatchScoreBadge } from "@/components/MatchScoreBadge";
import { SkillBadge } from "@/components/SkillBadge";
import type { RankResponse } from "@/lib/jobfit-api";
import type { JobMatch } from "@/lib/mock-data";

function uniqueItems(items: Array<string | undefined>) {
  const seen = new Set<string>();
  return items.filter((item): item is string => {
    if (!item) return false;
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fallbackResumeChanges(job: JobMatch) {
  const matched = job.matchedSkills?.slice(0, 4).join(", ") || "your strongest relevant skills";
  const missing = job.missingSkills?.slice(0, 3).join(", ");
  const changes = [
    `Adjust your resume summary or top project language toward ${job.title}.`,
    `Move a relevant project higher and make the first bullet mention ${matched}.`,
    "Add one measurable result, such as accuracy, time saved, users supported, records processed, or dashboard impact."
  ];

  if (missing) {
    changes.push(`Add evidence for ${missing} only if you can truthfully support it with coursework, a project, or experience.`);
  } else {
    changes.push("You do not have major extracted gaps, so focus on clearer outcomes and stronger role wording.");
  }

  return changes;
}

function FeedbackSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-white p-6 shadow-sm">
      <h2 className="text-xl font-black tracking-tight text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function MatchDetailsClient({ id, fallbackJobs }: { id: string; fallbackJobs: JobMatch[] }) {
  const [jobs, setJobs] = useState<JobMatch[]>(fallbackJobs);

  useEffect(() => {
    const saved = window.localStorage.getItem("jobfit:ranked-results");
    if (saved) {
      const parsed = JSON.parse(saved) as RankResponse;
      setJobs(parsed.jobs);
    }
  }, []);

  const decodedId = decodeURIComponent(id);
  const job = jobs.find((item) => item.id === id || item.id === decodedId || item.backendId === decodedId);

  if (!job) {
    return (
      <EmptyState
        title="Match not found"
        description="This job was not found in the current scan results. Return to matches or upload a resume again."
        actionLabel="Back to dashboard"
        actionHref="/dashboard"
      />
    );
  }

  const applyHref = job.applyUrl || job.applicationLink;
  const explanation = job.matchExplanation || job.personalizedSummary || job.summary;
  const improvementTips = job.improvementTips?.length ? job.improvementTips : job.improvements;
  const planItems = job.applyPlan ? job.applyPlan.split("\n").filter(Boolean) : improvementTips;
  const resumeChanges = job.resumeChanges?.length ? job.resumeChanges : fallbackResumeChanges(job);
  const resumeKeywords = job.resumeKeywords?.length
    ? job.resumeKeywords
    : uniqueItems([...(job.missingSkills ?? []), ...(job.matchedSkills ?? [])]).slice(0, 10);
  const suggestedExperience = job.suggestedExperience?.length
    ? job.suggestedExperience
    : [
        `Lead with the project or experience that best proves ${job.matchedSkills?.slice(0, 4).join(", ") || "the role requirements"}.`,
        "Highlight business impact, technical ownership, and the tools used to build the result."
      ];
  const resumeBulletChanges = job.resumeBulletChanges ?? [];

  return (
    <>
      <Link href="/dashboard" className="text-sm font-bold text-brand-600 hover:text-brand-700">
        Back to dashboard
      </Link>

      <div className="mt-6 overflow-hidden rounded-3xl bg-ink shadow-soft">
        <div className="grid gap-8 p-8 text-white lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">{job.company}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">{job.title}</h1>
              {job.aiEnhanced ? (
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-violet-800">
                  Gemini-enhanced recommendations
                </span>
              ) : null}
            </div>
            <p className="mt-4 text-slate-300">
              {job.location} · {job.type} · {job.posted}
            </p>
            <p className="mt-6 max-w-3xl text-base leading-7 text-slate-200">{explanation}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <MatchScoreBadge score={job.matchScore ?? job.score} recommendation={job.recommendation} />
            <ApplyButton
              href={applyHref}
              className="flex justify-center rounded-full bg-brand-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-600"
              disabledClassName="rounded-full bg-white/10 px-5 py-3 text-center text-sm font-bold text-slate-300"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-8">


          {job.aiRecruiterRelatednessScore ? (
            <FeedbackSection title="AI recruiter relatedness review">
              <div className="rounded-2xl bg-violet-50 p-5 text-sm leading-6 text-violet-950 ring-1 ring-violet-100">
                <p className="text-lg font-black">{job.aiRecruiterRelatednessScore}/100 recruiter relatedness</p>
                {job.deterministicScore ? (
                  <p className="mt-2 text-violet-800">Original deterministic score: {job.deterministicScore.toFixed(1)} · AI-adjusted score: {(job.matchScore ?? job.score).toFixed(1)}</p>
                ) : null}
                {job.aiRecruiterReasoning ? <p className="mt-4">{job.aiRecruiterReasoning}</p> : null}
              </div>
              {job.aiRecruiterEvidence?.length ? (
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Related evidence</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {job.aiRecruiterEvidence.map((item) => (
                      <span key={item} className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
              {job.aiRecruiterConcerns?.length ? (
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Concerns</p>
                  <div className="mt-2 space-y-2">
                    {job.aiRecruiterConcerns.map((item) => (
                      <p key={item} className="rounded-2xl bg-amber-50 p-3 text-sm leading-6 text-amber-800 ring-1 ring-amber-100">
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}
            </FeedbackSection>
          ) : null}

          <FeedbackSection title={job.aiEnhanced ? "Resume bullets to rewrite with Gemini" : "Resume bullets to rewrite"}>
            {resumeBulletChanges.length ? (
              <div className="space-y-4">
                {resumeBulletChanges.map((change, index) => (
                  <div key={`${change.current}-${index}`} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Current resume bullet</p>
                    <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-700">{change.current}</p>
                    <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-brand-600">Change it toward</p>
                    <p className="mt-2 text-sm font-medium leading-6 text-ink">{change.suggestion}</p>
                    <p className="mt-3 text-sm leading-6 text-slateSoft">{change.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slateSoft">
                Run a fresh resume scan to see exact bullets from your resume that JobFIT recommends rewriting for this role.
              </p>
            )}
          </FeedbackSection>

          <FeedbackSection title="What to change on your resume">
            <div className="space-y-3">
              {resumeChanges.map((change, index) => (
                <div key={change} className="flex gap-4 rounded-2xl bg-brand-50 p-4 text-sm leading-6 text-slate-700">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <p>{change}</p>
                </div>
              ))}
            </div>
          </FeedbackSection>

          <FeedbackSection title="Why this job fits you">
            <p className="text-sm leading-7 text-slateSoft">{explanation}</p>
            {job.scoreBreakdown ? <p className="mt-4 text-sm leading-6 text-slateSoft">{job.scoreBreakdown}</p> : null}
          </FeedbackSection>

          <FeedbackSection title="How to improve your application">
            <div className="space-y-3">
              {planItems.length ? (
                planItems.map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-700">
                    {item}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slateSoft">No improvement tips were generated for this job yet.</p>
              )}
            </div>
          </FeedbackSection>

          <FeedbackSection title="Suggested projects or experience to highlight">
            <div className="space-y-3">
              {suggestedExperience.map((item) => (
                <div key={item} className="rounded-2xl border border-line p-4 text-sm leading-6 text-slate-700">
                  {item}
                </div>
              ))}
            </div>
          </FeedbackSection>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink">Skills you already match</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {job.matchedSkills?.length ? (
                job.matchedSkills.map((skill) => (
                  <SkillBadge key={skill} tone="match">
                    {skill}
                  </SkillBadge>
                ))
              ) : (
                <p className="text-sm text-slateSoft">No matched skills were extracted yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink">Skills you are missing</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {job.missingSkills?.length ? (
                job.missingSkills.map((skill) => (
                  <SkillBadge key={skill} tone="missing">
                    {skill}
                  </SkillBadge>
                ))
              ) : (
                <p className="text-sm text-slateSoft">No major extracted gaps.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink">Resume keywords to add if truthful</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {resumeKeywords.length ? (
                resumeKeywords.map((keyword) => (
                  <span key={keyword} className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                    {keyword}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slateSoft">No keyword suggestions available yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-ink">Apply link</h2>
            <div className="mt-4">
              <ApplyButton
                href={applyHref}
                label="Open application"
                className="flex w-full justify-center rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
                disabledClassName="block rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slateSoft"
              />
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
