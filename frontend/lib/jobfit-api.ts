import type { JobMatch } from "./mock-data";

export type User = { id: number; email: string; firstName?: string; lastName?: string; displayName?: string; createdAt: string };

export type AuthResponse = { token: string; user: User };

export type ResumeRecord = { id: number; filename: string; contentType: string; fileSize: number; sha256: string; encrypted: boolean; createdAt: string };

export type ResumeStructured = { skills: string[]; projects: string[]; education: string[]; experienceBullets: string[]; keywords: string[] };

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

export type JobSourceCacheEntry = {
  sourceName: string;
  sourceUrl: string;
  fetchedAt: string;
  jobCount: number;
  updatedAt?: string;
};

export type JobSourcesResponse = {
  defaultSource: string;
  sources: string[];
  cache: JobSourceCacheEntry[];
  cacheTtlMinutes: number;
};

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
  returnedCount?: number;
  maxReturnedJobs?: number;
  aiError?: string;
  requestId?: string;
  latencyMs?: number | null;
  aiCostEstimate?: number;
  aiProvider?: string;
  resumeStructured?: ResumeStructured;
  warnings?: string[];
};

const PROXY_API_BASE_URL = "/api/jobfit";

export const API_BASE_URL = PROXY_API_BASE_URL;
export const AUTH_TOKEN_KEY = "jobfit:auth-token";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

function supabaseAuthEnabled() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

async function supabaseAuthRequest(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error_description || payload.msg || payload.message || "Supabase Auth request failed");
  }
  return payload;
}

async function backendUserFromToken(token: string): Promise<User> {
  const response = await apiFetch("/api/auth/me", { headers: authHeaders(token) });
  const account = await parseOrThrow(response, "Unable to load account");
  return account.user;
}

export function getAuthToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(AUTH_TOKEN_KEY) || "";
}

export const AUTH_CHANGED_EVENT = "jobfit:auth-changed";

export function notifyAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}

export function setAuthToken(token: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    notifyAuthChanged();
  }
}

export function clearAuthToken() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
    notifyAuthChanged();
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
  payload: { source: string; preferred_roles: string[]; preferred_locations: string; preferred_job_types?: string[]; use_ai_recommendations: boolean }
): Promise<RankResponse> {
  const response = await apiFetch(`/api/rank/resume/${resumeId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload)
  });

  return parseOrThrow(response, "Unable to rank saved resume");
}

export async function registerAccount(email: string, password: string, firstName = "", lastName = ""): Promise<AuthResponse> {
  if (supabaseAuthEnabled()) {
    const payload = await supabaseAuthRequest("signup", {
      email,
      password,
      data: { first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}`.trim() }
    });
    const token = payload.access_token || payload.session?.access_token;
    if (!token) throw new Error("Account created. Check your email to confirm before signing in.");
    const user = await backendUserFromToken(token);
    return { token, user };
  }
  const response = await apiFetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, firstName, lastName })
  });
  return parseOrThrow(response, "Unable to create account");
}

export async function loginAccount(email: string, password: string): Promise<AuthResponse> {
  if (supabaseAuthEnabled()) {
    const payload = await supabaseAuthRequest("token?grant_type=password", { email, password });
    const token = payload.access_token || payload.session?.access_token;
    if (!token) throw new Error("Unable to start a Supabase session");
    const user = await backendUserFromToken(token);
    return { token, user };
  }
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
  const token = getAuthToken();
  if (supabaseAuthEnabled() && token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` }
    }).catch(() => null);
  }
  await apiFetch("/api/auth/logout", { method: "POST", headers: authHeaders() }).catch(() => null);
  clearAuthToken();
}

export async function deleteResume(resumeId: number) {
  const response = await apiFetch(`/api/resumes/${resumeId}`, { method: "DELETE", headers: authHeaders() });
  return parseOrThrow(response, "Unable to delete resume");
}

export async function deleteAccount() {
  const response = await apiFetch("/api/account", { method: "DELETE", headers: authHeaders() });
  const result = await parseOrThrow(response, "Unable to delete account");
  clearAuthToken();
  return result;
}

export async function fetchSavedMatches(): Promise<SavedMatchesResponse> {
  const response = await apiFetch("/api/saved-matches", { headers: authHeaders() });
  return parseOrThrow(response, "Unable to load saved matches");
}

export async function fetchJobSources(): Promise<JobSourcesResponse> {
  const response = await apiFetch("/api/job-sources", { cache: "no-store" });
  return parseOrThrow(response, "Unable to load job sources");
}

export async function saveMatch(job: JobMatch, status = "Saved", notes = "") {
  const response = await apiFetch("/api/saved-matches", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ job, status, notes })
  });
  return parseOrThrow(response, "Unable to save match");
}
