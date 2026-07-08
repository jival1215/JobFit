import type { JobMatch } from "./mock-data";

export type User = { id: number; email: string; createdAt: string };

export type AuthResponse = { token: string; user: User };

export type AccountResponse = { user: User; summary: Record<string, number>; matchRuns: Array<Record<string, unknown>> };

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
};

export const API_BASE_URL = process.env.NEXT_PUBLIC_JOBFIT_API_URL || "http://127.0.0.1:8000";
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

async function parseOrThrow(response: Response, fallback: string) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || fallback);
  }
  return response.json();
}

export async function rankResume(formData: FormData): Promise<RankResponse> {
  const response = await fetch(`${API_BASE_URL}/api/rank`, {
    method: "POST",
    headers: authHeaders(),
    body: formData
  });

  return parseOrThrow(response, "Unable to rank resume");
}

export async function registerAccount(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return parseOrThrow(response, "Unable to create account");
}

export async function loginAccount(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return parseOrThrow(response, "Unable to sign in");
}

export async function fetchAccount(): Promise<AccountResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, { headers: authHeaders() });
  return parseOrThrow(response, "Unable to load account");
}

export async function logoutAccount() {
  await fetch(`${API_BASE_URL}/api/auth/logout`, { method: "POST", headers: authHeaders() }).catch(() => null);
  clearAuthToken();
}

export async function fetchSavedMatches(): Promise<SavedMatchesResponse> {
  const response = await fetch(`${API_BASE_URL}/api/saved-matches`, { headers: authHeaders() });
  return parseOrThrow(response, "Unable to load saved matches");
}

export async function saveMatch(job: JobMatch, status = "Saved", notes = "") {
  const response = await fetch(`${API_BASE_URL}/api/saved-matches`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ job, status, notes })
  });
  return parseOrThrow(response, "Unable to save match");
}
