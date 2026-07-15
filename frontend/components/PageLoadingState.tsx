export function PageLoadingState() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-line bg-white shadow-soft">
        <div className="grid gap-0 lg:grid-cols-[1fr_.8fr]">
          <div className="bg-ink p-8 text-white sm:p-10">
            <div className="h-3 w-28 animate-pulse rounded-full bg-brand-300/70" />
            <div className="mt-6 h-12 w-3/4 animate-pulse rounded-2xl bg-white/12" />
            <div className="mt-4 h-12 w-1/2 animate-pulse rounded-2xl bg-white/12" />
            <div className="mt-8 space-y-3">
              <div className="h-3 w-full animate-pulse rounded-full bg-white/10" />
              <div className="h-3 w-5/6 animate-pulse rounded-full bg-white/10" />
            </div>
          </div>
          <div className="space-y-4 p-8 sm:p-10">
            <div className="h-5 w-32 animate-pulse rounded-full bg-slate-100" />
            <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-12 w-40 animate-pulse rounded-full bg-brand-100" />
          </div>
        </div>
      </div>
    </section>
  );
}
