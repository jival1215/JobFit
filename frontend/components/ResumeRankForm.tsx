"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { rankResume } from "@/lib/jobfit-api";
import { UploadBox } from "./UploadBox";

const roleOptions = ["data", "data science", "data engineering", "ai/ml", "software"];

export function ResumeRankForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [source, setSource] = useState("Summer internships");
  const [locations, setLocations] = useState("Remote, NYC, New Jersey");
  const [roles, setRoles] = useState(["data", "data science", "data engineering", "ai/ml"]);
  const [useAiRecommendations, setUseAiRecommendations] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function toggleRole(role: string) {
    setRoles((current) => (current.includes(role) ? current.filter((item) => item !== role) : [...current, role]));
  }

  async function handleSubmit() {
    if (!file) {
      setError("Choose a resume file first.");
      return;
    }

    setIsLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("source", source);
    formData.append("preferred_roles", JSON.stringify(roles));
    formData.append("preferred_locations", locations);
    formData.append("use_ai_recommendations", String(useAiRecommendations));

    try {
      const result = await rankResume(formData);
      localStorage.setItem("jobfit:ranked-results", JSON.stringify(result));
      router.push("/matches");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while ranking your resume.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-line bg-white p-6 shadow-soft">
      <UploadBox fileName={file?.name} onFileChange={setFile} />
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-semibold text-ink">Job source</span>
          <select
            value={source}
            onChange={(event) => setSource(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-500"
          >
            <option>Summer internships</option>
            <option>Fall internships</option>
            <option>Full time</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-ink">Location preference</span>
          <input
            value={locations}
            onChange={(event) => setLocations(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-500"
            placeholder="Remote, NYC, New Jersey"
          />
        </label>
      </div>
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
                  ? "bg-brand-600 text-white ring-brand-600"
                  : "bg-white text-slate-700 ring-line hover:bg-slate-50"
              }`}
            >
              {role}
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
            Starts with the normal match score, then lets Gemini review the strongest candidates for recruiter-style relatedness and resume feedback.
          </span>
        </span>
      </label>
      {error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="mt-6 flex w-full justify-center rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Ranking with backend..." : useAiRecommendations ? "Generate matches + Gemini recruiter review" : "Generate real matches"}
      </button>
      <Link href="/matches" className="mt-3 flex w-full justify-center text-sm font-semibold text-brand-600 hover:text-brand-700">
        View mock matches instead
      </Link>
    </div>
  );
}
