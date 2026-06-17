type SkillBadgeProps = {
  children: string;
  tone?: "match" | "missing" | "neutral";
};

export function SkillBadge({ children, tone = "neutral" }: SkillBadgeProps) {
  const styles = {
    match: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    missing: "bg-amber-50 text-amber-700 ring-amber-200",
    neutral: "bg-slate-100 text-slate-700 ring-slate-200"
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${styles[tone]}`}>
      {children}
    </span>
  );
}
