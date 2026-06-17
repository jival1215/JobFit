import { EmptyState } from "@/components/EmptyState";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
      <EmptyState
        title="Page not found"
        description="That route does not exist in the JobFIT frontend."
        actionLabel="Go home"
        actionHref="/"
      />
    </section>
  );
}
