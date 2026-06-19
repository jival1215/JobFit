import { MatchesClient } from "@/components/MatchesClient";
import { jobMatches } from "@/lib/mock-data";

export default function MatchesPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <MatchesClient fallbackJobs={jobMatches} />
    </section>
  );
}
