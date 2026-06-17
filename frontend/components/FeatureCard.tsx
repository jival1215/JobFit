type FeatureCardProps = {
  title: string;
  description: string;
};

export function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="group rounded-3xl border border-line bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <div className="mb-6 h-10 w-10 rounded-2xl bg-brand-50 ring-1 ring-brand-100 transition group-hover:bg-brand-100" />
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slateSoft">{description}</p>
    </div>
  );
}
