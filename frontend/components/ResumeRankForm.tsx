"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { fetchAccount, getAuthToken, rankResume, rankSavedResume, type AccountResponse } from "@/lib/jobfit-api";
import { UploadBox } from "./UploadBox";

const roleOptions = ["data", "data science", "data engineering", "ai/ml", "software"];
const jobTypeOptions = ["Internship", "Co-op", "Full-Time"];
const ALL_REPOS_SOURCE = "All job repos";

export function ResumeRankForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [locations, setLocations] = useState("Remote, NYC, New Jersey");
  const [roles, setRoles] = useState(["data", "data science", "data engineering", "ai/ml"]);
  const [jobTypes, setJobTypes] = useState(jobTypeOptions);
  const [useAiRecommendations, setUseAiRecommendations] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState("new");
  const [account, setAccount] = useState<AccountResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getAuthToken()) return;
    fetchAccount()
      .then((result) => {
        setAccount(result);
        if (result.resumes?.[0]) setSelectedResumeId(String(result.resumes[0].id));
      })
      .catch(() => setAccount(null));
  }, []);

  const selectedResume = useMemo(() => {
    return account?.resumes?.find((resume) => String(resume.id) === selectedResumeId) ?? null;
  }, [account?.resumes, selectedResumeId]);

  function toggleRole(role: string) {
    setRoles((current) => (current.includes(role) ? current.filter((item) => item !== role) : [...current, role]));
  }

  function toggleJobType(jobType: string) {
    setJobTypes((current) => (current.includes(jobType) ? current.filter((item) => item !== jobType) : [...current, jobType]));
  }

  async function handleSubmit() {
    if (selectedResumeId === "new" && !file) {
      setError(account?.resumes?.length ? "Choose a saved resume or upload a new file." : "Choose a resume file first.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const payload = {
        source: ALL_REPOS_SOURCE,
        preferred_roles: roles,
        preferred_locations: locations,
        preferred_job_types: jobTypes.length ? jobTypes : jobTypeOptions,
        use_ai_recommendations: useAiRecommendations
      };
      const result = selectedResumeId !== "new" && selectedResume
        ? await rankSavedResume(Number(selectedResumeId), payload)
        : await rankUploadedResume(payload);
      localStorage.setItem("jobfit:ranked-results", JSON.stringify(result));
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while ranking your resume.");
    } finally {
      setIsLoading(false);
    }
  }

  async function rankUploadedResume(payload: { source: string; preferred_roles: string[]; preferred_locations: string; preferred_job_types: string[]; use_ai_recommendations: boolean }) {
    const formData = new FormData();
    formData.append("resume", file as File);
    formData.append("source", payload.source);
    formData.append("preferred_roles", JSON.stringify(payload.preferred_roles));
    formData.append("preferred_locations", payload.preferred_locations);
    formData.append("preferred_job_types", JSON.stringify(payload.preferred_job_types));
    formData.append("use_ai_recommendations", String(payload.use_ai_recommendations));
    return rankResume(formData);
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-line bg-white shadow-soft">
      <div className="border-b border-line bg-slate-50/70 p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Resume source</p>
            <h2 className="mt-2 text-2xl font-black text-ink">Start with a saved resume or upload a new one.</h2>
          </div>
          {account ? (
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-200">
              {account.resumes?.length ?? 0} saved resume{account.resumes?.length === 1 ? "" : "s"}
            </span>
          ) : (
            <Link href="/account" className="rounded-full border border-line bg-white px-4 py-2 text-xs font-black text-slate-600 hover:text-ink">
              Sign in to reuse resumes
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[.95fr_1.05fr]">
        <div className="border-b border-line p-5 sm:p-6 lg:border-b-0 lg:border-r">
          {account?.resumes?.length ? (
            <div className="space-y-3">
              <label className="block text-sm font-bold text-ink">Saved resumes</label>
              <div className="space-y-2">
                {account.resumes.map((resume) => (
                  <button
                    key={resume.id}
                    type="button"
                    onClick={() => setSelectedResumeId(String(resume.id))}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedResumeId === String(resume.id)
                        ? "border-brand-500 bg-brand-50 text-ink shadow-sm"
                        : "border-line bg-white text-slate-700 hover:border-brand-100 hover:bg-slate-50"
                    }`}
                  >
                    <span className="block text-sm font-black">{resume.filename}</span>
                    <span className="mt-1 block text-xs font-semibold text-slateSoft">
                      {Math.max(1, Math.round(resume.fileSize / 1024))}KB · {resume.encrypted ? "encrypted" : "stored"}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSelectedResumeId("new")}
                  className={`w-full rounded-2xl border p-4 text-left text-sm font-black transition ${
                    selectedResumeId === "new" ? "border-brand-500 bg-brand-50 text-ink" : "border-line bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Upload a different resume
                </button>
              </div>
            </div>
          ) : null}

          {selectedResumeId === "new" ? (
            <div className={account?.resumes?.length ? "mt-5" : ""}>
              <UploadBox fileName={file?.name} onFileChange={setFile} />
            </div>
          ) : selectedResume ? (
            <div className="mt-5 rounded-2xl bg-ink p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-300">Using saved resume</p>
              <h3 className="mt-2 text-xl font-black">{selectedResume.filename}</h3>
              <p className="mt-2 text-sm leading-6 text-white/70">
                JobFIT will reuse the extracted resume text already stored in your account, so you do not need to upload the same file again.
              </p>
            </div>
          ) : null}
        </div>

        <div className="p-5 sm:p-6">
          <div className="rounded-2xl border border-line bg-slate-50 p-4">
            <p className="text-sm font-bold text-ink">Job database</p>
            <p className="mt-1 text-sm leading-6 text-slateSoft">
              Every scan searches all connected SimplifyJobs and Jobright repos. Use the filters below to narrow by role and job type.
            </p>
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-semibold text-ink">Location preference</span>
            <input
              value={locations}
              onChange={(event) => setLocations(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-500"
              placeholder="Remote, NYC, New Jersey"
            />
          </label>

          <div className="mt-5">
            <span className="text-sm font-semibold text-ink">Role focus</span>
            <div className="mt-3 flex flex-wrap gap-2">
              {roleOptions.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => toggleRole(role)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
                    roles.includes(role)
                      ? "bg-ink text-white ring-ink"
                      : "bg-white text-slate-700 ring-line hover:bg-slate-50"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <span className="text-sm font-semibold text-ink">Job type</span>
            <div className="mt-3 flex flex-wrap gap-2">
              {jobTypeOptions.map((jobType) => (
                <button
                  key={jobType}
                  type="button"
                  onClick={() => toggleJobType(jobType)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${
                    jobTypes.includes(jobType)
                      ? "bg-brand-600 text-white ring-brand-600"
                      : "bg-white text-slate-700 ring-line hover:bg-slate-50"
                  }`}
                >
                  {jobType}
                </button>
              ))}
            </div>
          </div>

          <label className="mt-5 flex items-start gap-3 rounded-2xl border border-line bg-slate-50 p-4">
            <input
              type="checkbox"
              checked={useAiRecommendations}
              onChange={(event) => setUseAiRecommendations(event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
            />
            <span>
              <span className="block text-sm font-bold text-ink">Use Gemini recruiter review</span>
              <span className="mt-1 block text-sm leading-6 text-slateSoft">
                Review the strongest matches for recruiter-style relatedness, resume bullet feedback, and application recommendations.
              </span>
            </span>
          </label>

          {error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="mt-6 flex w-full justify-center rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (useAiRecommendations ? "Running Gemini review..." : "Ranking matches...") : selectedResumeId === "new" ? "Generate matches" : "Generate matches from saved resume"}
          </button>
          {isLoading && useAiRecommendations ? (
            <p className="mt-3 text-center text-sm font-medium text-slateSoft">Gemini is reviewing the strongest matches. This usually takes under 30 seconds.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
