import { MatchDetailsClient } from "@/components/MatchDetailsClient";
import { jobMatches } from "@/lib/mock-data";

type JobDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailsPage({ params }: JobDetailsPageProps) {
  const { id } = await params;
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <MatchDetailsClient id={id} fallbackJobs={jobMatches} />
    </section>
  );
}
