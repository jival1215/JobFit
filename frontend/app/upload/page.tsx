import { ResumeRankForm } from "@/components/ResumeRankForm";

const steps = ["Choose resume", "Pick job source", "Review ranked matches"];

export default function UploadPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-6 rounded-[2rem] border border-line bg-white p-6 shadow-soft sm:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Resume upload</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-5xl">
            Find your best-fit roles.
          </h1>
          <p className="mt-4 text-base leading-7 text-slateSoft sm:text-lg">
            Upload once or reuse a saved resume, choose the job pool, and JobFIT will rank real postings by fit, skills, freshness, and recruiter-style signals.
          </p>
        </div>
        <div className="grid gap-2 text-sm font-semibold text-slate-600 sm:grid-cols-3 lg:min-w-[420px]">
          {steps.map((step, index) => (
            <div key={step} className="rounded-2xl border border-line bg-cloud px-4 py-3">
              <span className="mr-2 text-brand-600">0{index + 1}</span>
              {step}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-4xl">
        <ResumeRankForm />
      </div>
    </section>
  );
}
