import { FeatureCard } from "@/components/FeatureCard";
import { features } from "@/lib/mock-data";

const scoringFactors = [
  { label: "Resume similarity", weight: "25%", detail: "Compares resume language against each posting using keyword and phrase similarity." },
  { label: "Skill overlap", weight: "25%", detail: "Maps Python, SQL, AI/ML, dashboards, databases, APIs, and related technical skills to each role." },
  { label: "Role fit", weight: "15%", detail: "Boosts target roles across data, AI/ML, software, analytics, BI, and engineering internships." },
  { label: "Freshness", weight: "20%", detail: "Prioritizes newer postings so users apply while roles are still active." },
  { label: "Location", weight: "5%", detail: "Uses preferred locations such as remote, NYC, New Jersey, Philadelphia, and U.S.-based roles." },
  { label: "Recruiter review", weight: "10%", detail: "Gemini reviews the strongest candidates for related experience, gaps, and application advice." },
];

const platformPieces = [
  ["Frontend", "Next.js and Tailwind interface for upload, dashboard, saved resumes, filters, and job feedback."],
  ["Backend", "FastAPI services for resume parsing, SimplifyJobs ingestion, deterministic ranking, and Gemini recommendations."],
  ["Storage", "Supabase/PostgreSQL stores users, resume records, saved jobs, match runs, and recommendation payloads."],
  ["Deployment", "Railway hosts the API and Amplify hosts the frontend, with environment-based configuration for secrets."],
];

const workflow = [
  "Create an account with a name, email, and password.",
  "Upload a PDF, DOCX, or TXT resume once, then reuse saved resumes for future scans.",
  "Refresh live internship and new-grad sources from SimplifyJobs-style GitHub repositories.",
  "Rank jobs with deterministic scoring, then optionally run Gemini recruiter review on the strongest matches.",
  "Save jobs, track applied/skipped status, and review resume bullet changes for each match.",
];

const agents = [
  ["Resume Intake", "Extracts text, stores resume records, and makes saved resumes reusable across scans."],
  ["Job Scout", "Fetches live GitHub job lists and normalizes company, role, location, age, source, and apply links."],
  ["Ranking Engine", "Scores jobs using skills, role fit, resume similarity, freshness, and location preferences."],
  ["Gemini Review", "Adds recruiter-style relatedness, feedback, missing skills, and resume tailoring suggestions."],
  ["Tracker", "Persists saved, applied, skipped, match history, and recommendation payloads per user."],
  ["Application Coach", "Turns each job into concrete resume keywords, project highlights, and next steps."],
];

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-line bg-white shadow-soft">
        <div className="grid gap-0 lg:grid-cols-[1.15fr_.85fr]">
          <div className="bg-ink p-8 text-white sm:p-10 lg:p-12">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-300">About JobFIT</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
              A full-stack AI workspace for choosing where to apply first.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
              JobFIT helps early-career candidates upload a resume, scan real internship and new-grad roles, rank jobs by fit, and save the best opportunities with personalized application feedback.
            </p>
          </div>
          <div className="p-8 sm:p-10 lg:p-12">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Production shape</p>
            <div className="mt-5 grid gap-3">
              {platformPieces.map(([label, detail]) => (
                <div key={label} className="rounded-2xl border border-line bg-slate-50 p-4">
                  <p className="font-black text-ink">{label}</p>
                  <p className="mt-2 text-sm leading-6 text-slateSoft">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => <FeatureCard key={feature.title} {...feature} />)}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-line bg-white p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Workflow</p>
          <h2 className="mt-3 text-2xl font-black text-ink">From resume to apply-first list</h2>
          <div className="mt-6 space-y-3">
            {workflow.map((item, index) => (
              <div key={item} className="flex gap-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-brand-700 ring-1 ring-brand-100">{index + 1}</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-line bg-white p-8 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Scoring</p>
          <h2 className="mt-3 text-2xl font-black text-ink">Transparent ranking with AI review</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {scoringFactors.map((factor) => (
              <div key={factor.label} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-black text-ink">{factor.label}</p>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700 ring-1 ring-brand-100">{factor.weight}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slateSoft">{factor.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-[2rem] border border-line bg-white p-8 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-600">Agent pipeline</p>
            <h2 className="mt-3 text-2xl font-black text-ink">Focused workers behind the product</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slateSoft">
            JobFIT keeps data tasks deterministic and uses Gemini only where judgment, explanation, and resume advice improve the user experience.
          </p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map(([name, role]) => (
            <div key={name} className="rounded-2xl border border-line bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:bg-white hover:shadow-soft">
              <p className="font-black text-ink">{name}</p>
              <p className="mt-3 text-sm leading-6 text-slateSoft">{role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
