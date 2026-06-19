"use client";

import { UploadCloud } from "lucide-react";

type UploadBoxProps = {
  fileName?: string;
  onFileChange?: (file: File | null) => void;
};

export function UploadBox({ fileName, onFileChange }: UploadBoxProps) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm transition hover:border-brand-300 hover:bg-brand-50/30">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <UploadCloud className="h-7 w-7" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-ink">Drop your resume here</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slateSoft">
        PDF, DOCX, or TXT. The file is sent to the local JobFIT Python API for extraction and matching.
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
        className="mt-6 inline-flex cursor-pointer rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        Choose file
      </label>
      {fileName ? <p className="mt-4 text-sm font-semibold text-ink">Selected: {fileName}</p> : null}
    </div>
  );
}
