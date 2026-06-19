import { MatchDetailsClient } from "@/components/MatchDetailsClient";
import { jobMatches } from "@/lib/mock-data";

type JobDetailsPageProps = {
  params: { id: string };
};

export default function JobDetailsPage({ params }: JobDetailsPageProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <MatchDetailsClient id={params.id} fallbackJobs={jobMatches} />
    </section>
  );
}
