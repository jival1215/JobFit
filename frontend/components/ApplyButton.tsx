"use client";

import type { MouseEvent } from "react";

type ApplyButtonProps = {
  href?: string;
  label?: string;
  className?: string;
  disabledClassName?: string;
};

function normalizeApplyUrl(href?: string) {
  const value = href?.trim();
  if (!value) return "";

  try {
    const url = new URL(value.startsWith("www.") ? `https://${value}` : value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.toString();
  } catch {
    return "";
  }
}

export function ApplyButton({
  href,
  label = "Apply",
  className = "rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700",
  disabledClassName = "rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-500"
}: ApplyButtonProps) {
  const applyUrl = normalizeApplyUrl(href);

  if (!applyUrl) {
    return <span className={disabledClassName}>No apply link</span>;
  }

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    event.stopPropagation();
  }

  return (
    <a href={applyUrl} target="_blank" rel="noreferrer" onClick={handleClick} className={className}>
      {label}
    </a>
  );
}
