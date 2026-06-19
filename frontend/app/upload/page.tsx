import { ResumeRankForm } from "@/components/ResumeRankForm";

export default function UploadPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-600">Resume upload</p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-ink sm:text-6xl">
            Start with the resume recruiters will scan.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slateSoft">
            This page sends your resume to the local Python backend, extracts the text, refreshes SimplifyJobs, and returns ranked matches.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-slate-600">
            <div className="rounded-2xl border border-line bg-white p-4">PDF, DOCX, and TXT ready</div>
            <div className="rounded-2xl border border-line bg-white p-4">Source selection for internships and new grad roles</div>
            <div className="rounded-2xl border border-line bg-white p-4">Connected to the local FastAPI bridge</div>
          </div>
        </div>
        <ResumeRankForm />
      </div>
    </section>
  );
}
