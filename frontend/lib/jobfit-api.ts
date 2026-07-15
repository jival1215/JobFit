import type { JobMatch } from "./mock-data";

export type User = { id: number; email: string; firstName?: string; lastName?: string; displayName?: string; createdAt: string };

export type AuthResponse = { token: string; user: User };

export type ResumeRecord = { id: number; filename: string; contentType: string; fileSize: number; sha256: string; encrypted: boolean; createdAt: string };

export type AccountResponse = {
  user: User;
  summary: Record<string, number>;
  matchRuns: Array<Record<string, unknown>>;
  resumes?: ResumeRecord[];
  resumeEncryptionEnabled?: boolean;
  usedJobCache?: boolean;
  jobCacheTtlMinutes?: number;
};

export type SavedMatchesResponse = { jobs: JobMatch[]; summary: Record<string, number> };

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
  user?: User | null;
  matchRunId?: number | null;
  resume?: ResumeRecord | null;
  resumeId?: number | null;
  resumeEncryptionEnabled?: boolean;
  usedJobCache?: boolean;
  jobCacheTtlMinutes?: number;
};

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_JOBFIT_API_URL?.replace(/\/$/, "") || "https://jobfit-api-production.up.railway.app";
export const AUTH_TOKEN_KEY = "jobfit:auth-token";

export function getAuthToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(AUTH_TOKEN_KEY) || "";
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

export function clearAuthToken() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

function authHeaders(token = getAuthToken()): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path: string, init?: RequestInit) {
  try {
    return await fetch(`${API_BASE_URL}${path}`, init);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Network request failed";
    throw new Error(`Unable to reach JobFIT backend: ${detail}`);
  }
}

async function parseOrThrow(response: Response, fallback: string) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const detail = error.detail || `${fallback} (${response.status} ${response.statusText || "error"})`;
    throw new Error(detail);
  }
  return response.json();
}

export async function rankResume(formData: FormData): Promise<RankResponse> {
  const response = await apiFetch("/api/rank", {
    method: "POST",
    headers: authHeaders(),
    body: formData
  });

  return parseOrThrow(response, "Unable to rank resume");
}

export async function rankSavedResume(
  resumeId: number,
  payload: { source: string; preferred_roles: string[]; preferred_locations: string; use_ai_recommendations: boolean }
): Promise<RankResponse> {
  const response = await apiFetch(`/api/rank/resume/${resumeId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload)
  });

  return parseOrThrow(response, "Unable to rank saved resume");
}

export async function registerAccount(email: string, password: string, firstName = "", lastName = ""): Promise<AuthResponse> {
  const response = await apiFetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, firstName, lastName })
  });
  return parseOrThrow(response, "Unable to create account");
}

export async function loginAccount(email: string, password: string): Promise<AuthResponse> {
  const response = await apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return parseOrThrow(response, "Unable to sign in");
}

export async function fetchAccount(): Promise<AccountResponse> {
  const response = await apiFetch("/api/auth/me", { headers: authHeaders() });
  return parseOrThrow(response, "Unable to load account");
}

export async function logoutAccount() {
  await apiFetch("/api/auth/logout", { method: "POST", headers: authHeaders() }).catch(() => null);
  clearAuthToken();
}

export async function fetchSavedMatches(): Promise<SavedMatchesResponse> {
  const response = await apiFetch("/api/saved-matches", { headers: authHeaders() });
  return parseOrThrow(response, "Unable to load saved matches");
}

export async function saveMatch(job: JobMatch, status = "Saved", notes = "") {
  const response = await apiFetch("/api/saved-matches", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ job, status, notes })
  });
  return parseOrThrow(response, "Unable to save match");
}
