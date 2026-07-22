# JobFIT Environment Variables

## Backend

| Variable | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | production | Supabase project URL. Enables Supabase storage when paired with a service-role key. |
| `SUPABASE_SERVICE_ROLE_KEY` | production | Server-only key used by the FastAPI backend to read/write JobFIT tables. Never expose to the browser. |
| `SUPABASE_ANON_KEY` | production auth | Used server-side to verify Supabase Auth access tokens. Can also be called `SUPABASE_PUBLISHABLE_KEY`. |
| `SUPABASE_PUBLISHABLE_KEY` | optional | Alternative name for the Supabase anon/publishable key. |
| `SUPABASE_TABLE_PREFIX` | optional | Defaults to `jobfit_`. Lets the backend target prefixed tables. |
| `JOBFIT_DB_PATH` | local | SQLite database path when Supabase is not configured. Defaults to `jobfit_local.db`. |
| `JOBFIT_SESSION_DAYS` | optional | Custom auth session duration. Defaults to 14 days. |
| `JOBFIT_ENCRYPTION_KEY` | recommended | Fernet key for encrypting stored resume files and extracted text. |
| `JOBFIT_MAX_RESUME_BYTES` | optional | Max upload size. Defaults to 5 MB. |
| `JOBFIT_JOB_CACHE_TTL_MINUTES` | optional | Job cache refresh window. Defaults to 360 minutes. |
| `GEMINI_API_KEY` | optional | Enables Gemini calls when recommendation flags are on. |
| `GEMINI_MODEL` | optional | Defaults to Gemini flash model configured in code. |
| `ENABLE_GEMINI_RECOMMENDATIONS` | optional | Set to `true` to allow Gemini recommendation enhancement. |
| `GEMINI_RECOMMENDATION_LIMIT` | optional | How many jobs receive detailed Gemini recommendations. |
| `GEMINI_RECRUITER_TARGET_SIZE` | optional | Target number of top jobs reviewed by Gemini reranking. |
| `GEMINI_RECRUITER_MAX_CANDIDATES` | optional | Max deterministic candidates eligible for Gemini review. |
| `GEMINI_RECRUITER_SCORE_WEIGHT` | optional | Blend weight for Gemini recruiter score. |
| `FRONTEND_ORIGINS` | production | Comma-separated list of allowed frontend origins for CORS. |

## Frontend

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_JOBFIT_API_URL` | production | Public URL for the FastAPI backend. |
| `NEXT_PUBLIC_SUPABASE_URL` | production auth | Supabase project URL for browser signup/login. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | production auth | Browser-safe Supabase anon/publishable key. Requires RLS on tables. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | optional | Alternative browser-safe key name. |

## Secret Rules

- Never commit `.env` files.
- Never put `SUPABASE_SERVICE_ROLE_KEY` in frontend variables.
- Never put `GEMINI_API_KEY` in frontend variables.
- Rotate exposed keys if they were pasted in public chats or committed to GitHub.
