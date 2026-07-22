# JobFIT Production Readiness

## Done

- Active code is organized into `backend/` and `frontend/`.
- Legacy Streamlit, disabled US job finder work, and AWS/Render experiments are archived under `legacy/`.
- Resume uploads validate file extension and size before parsing.
- Resume text is normalized and structured into skills, projects, education, experience bullets, and keywords.
- FastAPI responses include request metadata such as `requestId`, `latencyMs`, `aiProvider`, `aiCostEstimate`, warnings, and `resumeStructured`.
- Backend logs request IDs, endpoints, status, latency, and error type without logging private resume text.
- Gemini recommendation calls retry transient failures and validate structured JSON before use.
- Gemini resume claims are filtered when they do not reference evidence present in the resume text.
- Supabase storage is supported for users, resumes, match runs, saved jobs, and job cache.
- Supabase Auth access tokens can be accepted by the backend and mapped to JobFIT users.
- Users can delete saved resumes.
- Users can delete their account data through `DELETE /api/account`.
- Active backend unit tests cover parsing, matching, Gemini fallback behavior, account deletion, and Supabase auth mapping.

## Partial

- Supabase Auth is integrated as the production path, but the original custom auth endpoints remain for compatibility.
- Resume parsing is structured and useful, but not a full formal resume parser with section-level confidence scores.
- AI cost tracking is an estimate based on reviewed/enhanced job counts, not a provider billing export.
- Privacy-safe logging is implemented in the app layer; production log retention policies still need to be configured in the host.
- Frontend account deletion calls the backend, but a final production pass should verify Supabase Auth delete behavior with the real service-role key.

## Not Done Yet

- Full Supabase-only auth migration that removes custom password/session tables.
- User-facing export/download of all stored personal data.
- Admin dashboard for monitoring usage, failures, latency, and Gemini costs.
- Background scheduled job-cache refresh independent of user scans.
- End-to-end browser tests against a deployed staging environment.
- Full OpenTelemetry or structured log shipping setup.
- Formal threat model and data retention policy.

## Manual QA Checklist

- Create an account with first name and last name.
- Confirm dashboard uses display name instead of email when available.
- Upload a valid PDF, DOCX, and TXT resume.
- Confirm unsupported file types fail cleanly.
- Confirm oversized files fail with a clear error.
- Run a scan with Gemini disabled.
- Run a scan with Gemini enabled.
- Save a job and confirm the button changes to saved.
- Open saved jobs and confirm the saved job appears.
- Delete a saved job.
- Delete a saved resume.
- Delete the account and verify resumes, match runs, saved jobs, sessions, and user row are removed.
