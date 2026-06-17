import { UploadCloud } from "lucide-react";

export function UploadBox() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm transition hover:border-brand-300 hover:bg-brand-50/30">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <UploadCloud className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-ink">Drop your resume here</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slateSoft">
        PDF, DOCX, or TXT. This mock UI is ready to connect to the existing Python resume extraction flow.
      </p>
      <button className="mt-6 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700">
        Choose file
      </button>
    </div>
  );
}
