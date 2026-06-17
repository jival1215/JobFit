import Link from "next/link";
import { UploadBox } from "@/components/UploadBox";

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
            The backend can connect this upload surface to the existing Python resume extraction and matcher. For now,
            the UI uses mock state that mirrors the intended workflow.
          </p>
          <div className="mt-8 grid gap-3 text-sm text-slate-600">
            <div className="rounded-2xl border border-line bg-white p-4">PDF, DOCX, and TXT ready</div>
            <div className="rounded-2xl border border-line bg-white p-4">Source selection for internships and new grad roles</div>
            <div className="rounded-2xl border border-line bg-white p-4">Structured for API integration later</div>
          </div>
        </div>
        <div className="rounded-3xl border border-line bg-white p-6 shadow-soft">
          <UploadBox />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-ink">Job source</span>
              <select className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-500">
                <option>Summer internships</option>
                <option>Fall internships</option>
                <option>Full time</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-ink">Location preference</span>
              <input
                className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-brand-500"
                placeholder="Remote, NYC, New Jersey"
              />
            </label>
          </div>
          <Link
            href="/matches"
            className="mt-6 flex w-full justify-center rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
          >
            Generate matches
          </Link>
        </div>
      </div>
    </section>
  );
}
