import clsx from "clsx";

type MatchScoreBadgeProps = {
  score: number;
  recommendation?: string;
};

export function MatchScoreBadge({ score, recommendation }: MatchScoreBadgeProps) {
  const tone =
    score >= 85
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : score >= 70
        ? "bg-blue-50 text-blue-700 ring-blue-200"
        : "bg-slate-100 text-slate-700 ring-slate-200";

  return (
    <span className={clsx("inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1", tone)}>
      {score}% match{recommendation ? ` · ${recommendation}` : ""}
    </span>
  );
}
