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

const agentPipeline = [
  {
    name: "Resume Intake Agent",
    role: "Extracts text from PDF, DOCX, or TXT resumes and normalizes the candidate profile for matching.",
  },
  {
    name: "Job Scout Agent",
    role: "Refreshes SimplifyJobs sources, parses changing markdown tables, and keeps company, title, location, apply link, age, and source metadata aligned.",
  },
  {
    name: "Skill Intelligence Agent",
    role: "Expands aliases such as ML, sklearn, PostgreSQL, generative AI, and JavaScript so matches are based on real skill meaning instead of one exact spelling.",
  },
  {
    name: "Deterministic Ranking Agent",
    role: "Scores every posting with transparent math across resume similarity, skill overlap, title match, related concepts, location, and freshness.",
  },
  {
    name: "Gemini Recruiter Review Agent",
    role: "Reviews only the strongest candidates, judges recruiter-style relatedness, and can pull a job into the true top 10 when the AI score proves stronger fit.",
  },
  {
    name: "Application Coach Agent",
    role: "Generates job-specific feedback, resume bullet changes, truthful keywords, missing skills, and projects to highlight before applying.",
  },
  {
    name: "Tracker Agent",
    role: "Stores local saved, applied, and skipped statuses so the ranked list can become an actual application workflow.",
  },
];

const geminiTechnique = [
  "Rank all jobs first with deterministic scoring so every result has an explainable baseline.",
  "Send only the strongest candidates to Gemini instead of paying to review every posting.",
  "Start with the top 10, then evaluate additional candidates when their best possible AI-adjusted score could break into the top 10.",
  "Blend the original score with the Gemini recruiter relatedness score, keeping the deterministic score visible for transparency.",
  "Use Gemini for qualitative judgment and feedback, while the backend still controls data fetching, parsing, filtering, and final ranking structure.",
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
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">Agent system</p>
            <h2 className="mt-3 text-2xl font-black text-ink">The agents behind JobFIT</h2>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slateSoft">
            JobFIT uses a practical agent-style pipeline: deterministic workers handle reliable data tasks, while Gemini is used only where judgment and personalized feedback are valuable.
          </p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agentPipeline.map((agent) => (
            <div key={agent.name} className="rounded-2xl border border-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
              <p className="font-black text-ink">{agent.name}</p>
              <p className="mt-3 text-sm leading-6 text-slateSoft">{agent.role}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
        <div className="rounded-3xl border border-line bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-700">Gemini sorting technique</p>
          <h2 className="mt-3 text-2xl font-black text-ink">AI reranking without losing transparency</h2>
          <div className="mt-6 space-y-4">
            {geminiTechnique.map((item, index) => (
              <div key={item} className="flex gap-4 rounded-2xl bg-violet-50 p-4 text-sm leading-6 text-violet-950 ring-1 ring-violet-100">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-violet-700 ring-1 ring-violet-200">
                  {index + 1}
                </span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-ink p-8 text-white shadow-soft">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-300">Why recruiters should care</p>
          <h2 className="mt-3 text-2xl font-black">Built like a real product, not a demo screen.</h2>
          <div className="mt-6 space-y-4 text-sm leading-6 text-white/74">
            <p>It connects a modern frontend to a working Python backend, real public job sources, resume parsing, scoring, filtering, and deployment.</p>
            <p>The AI layer is cost-aware: Gemini reviews the jobs most likely to matter instead of being called blindly for every row.</p>
            <p>The matching is explainable: users can see score factors, matched skills, missing skills, AI reasoning, resume edits, and direct apply links.</p>
            <p>The architecture is easy to extend into authentication, databases, saved searches, email alerts, or employer-specific ranking later.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
