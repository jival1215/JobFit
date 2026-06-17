type StatsCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function StatsCard({ label, value, detail }: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slateSoft">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </div>
  );
}
