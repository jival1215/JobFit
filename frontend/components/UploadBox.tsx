"use client";

import { UploadCloud } from "lucide-react";

type UploadBoxProps = {
  fileName?: string;
  onFileChange?: (file: File | null) => void;
};

export function UploadBox({ fileName, onFileChange }: UploadBoxProps) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center shadow-sm transition hover:border-brand-300 hover:bg-brand-50/40 sm:p-8">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-600 ring-1 ring-line">
        <UploadCloud className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-xl font-bold text-ink">Upload your resume</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slateSoft">
        PDF, DOCX, or TXT. Your resume is used only to generate the ranked match list.
      </p>
      <input
        id="resume-upload"
        type="file"
        accept=".pdf,.docx,.txt"
        className="sr-only"
        onChange={(event) => onFileChange?.(event.target.files?.[0] ?? null)}
      />
      <label
        htmlFor="resume-upload"
        className="mt-6 inline-flex cursor-pointer rounded-full bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700"
      >
        Choose file
      </label>
      {fileName ? <p className="mt-4 text-sm font-semibold text-ink">Selected: {fileName}</p> : null}
    </div>
  );
}
