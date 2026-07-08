import { FeatureCard } from "@/components/FeatureCard";
import { features } from "@/lib/mock-data";

const scoringFactors = [
  { label: "Resume/job similarity", weight: "25%", detail: "Compares your resume language with each posting using keyword and phrase similarity." },
  { label: "Skill overlap", weight: "25%", detail: "Checks whether the job lines up with your tools, languages, analytics, AI, ML, dashboard, and database skills." },
  { label: "Role title match", weight: "15%", detail: "Boosts roles that match your targets, like data analyst, data science, data engineering, AI/ML, and software." },
  { label: "Recruiter concept match", weight: "10%", detail: "Looks for related ideas a recruiter would connect, even when the exact words are not identical." },
  { label: "Location preference", weight: "5%", detail: "Prioritizes preferred locations such as remote, NYC, New Jersey, Philadelphia, and U.S.-based roles." },
  { label: "Date posted", weight: "20%", detail: "Gives a major boost to fresh postings so you apply while roles are still active." },
];

const workflow = [
  "Upload a PDF, DOCX, or TXT resume.",
  "JobFIT extracts resume text and refreshes live job postings from SimplifyJobs sources.",
  "The backend ranks every job with deterministic scoring across fit, skills, role, location, and freshness.",
  "If enabled, Gemini reviews the strongest candidates like a recruiter and reranks the true top matches.",
  "Each job includes apply links, matched skills, missing skills, resume bullet changes, and application tips.",
];

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl bg-ink text-white shadow-soft ring-1 ring-black/10">
        <div className="grid gap-8 p-8 lg:grid-cols-[1.2fr_.8fr] lg:p-12">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-300">About JobFIT</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
              A smarter way to decide which jobs deserve your first applications.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
              JobFIT helps students and early-career job seekers upload a resume, scan real internship and new-grad
              postings, and rank opportunities by fit. It combines transparent matching logic with optional Gemini
              recruiter review, so the results feel less like a keyword counter and more like practical application advice.
            </p>
          </div>
          <div className="rounded-3xl bg-white/8 p-6 ring-1 ring-white/12">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-300">Current stack</p>
            <div className="mt-5 space-y-3 text-sm leading-6 text-white/76">
              <p>Next.js and Tailwind frontend deployed on Vercel.</p>
              <p>FastAPI backend deployed on Railway.</p>
              <p>Python matcher with pandas, scikit-learn, resume parsing, SimplifyJobs fetching, and Gemini recommendations.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-3xl border border-line bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-black text-ink">How it works</h2>
          <div className="mt-6 space-y-4">
            {workflow.map((item, index) => (
              <div key={item} className="flex gap-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-black text-brand-700">
                  {index + 1}
                </span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-line bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-black text-ink">What the match score uses</h2>
          <p className="mt-3 text-sm leading-6 text-slateSoft">
            The score starts with deterministic ranking, then Gemini can review the strongest candidates to add recruiter-style relatedness and personalized feedback.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {scoringFactors.map((factor) => (
              <div key={factor.label} className="rounded-2xl border border-line bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-black text-ink">{factor.label}</p>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-black text-brand-700 ring-1 ring-brand-100">
                    {factor.weight}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slateSoft">{factor.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-3xl border border-line bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-black text-ink">What Gemini adds</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            "Reviews only the strongest candidates so the app stays useful without calling AI for every posting.",
            "Scores recruiter-style relatedness by looking at projects, tools, domain fit, and transferable experience.",
            "Creates job-specific feedback, including resume bullets to rewrite, truthful keywords to add, and experience to highlight.",
          ].map((item) => (
            <div key={item} className="rounded-2xl bg-violet-50 p-5 text-sm leading-6 text-violet-900 ring-1 ring-violet-100">
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
