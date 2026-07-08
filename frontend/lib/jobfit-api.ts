import type { JobMatch } from "./mock-data";

export type RankResponse = {
  source: string;
  sourceUrl?: string;
  fetchedAt?: string;
  count: number;
  newCount: number;
  aiRecommendationsRequested?: boolean;
  aiRecommendationsEnabled?: boolean;
  aiRecruiterRerankEnabled?: boolean;
  aiRecruiterReviewedCount?: number;
  aiEnhancedCount?: number;
  jobs: JobMatch[];
  tracker?: Record<string, number>;
};

export const API_BASE_URL = process.env.NEXT_PUBLIC_JOBFIT_API_URL || "http://127.0.0.1:8000";

export async function rankResume(formData: FormData): Promise<RankResponse> {
  const response = await fetch(`${API_BASE_URL}/api/rank`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Unable to rank resume");
  }

  return response.json();
}
