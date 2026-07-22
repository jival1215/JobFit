# JobFIT File Map

This file explains the major files in plain English so the repo is easier to understand and maintain.

## Root Files

| File | Status | Purpose |
| --- | --- | --- |
| `README.md` | active docs | Recruiter-friendly project overview, setup, deployment path, and testing commands. |
| `app.py` | active backend shim | Exposes the FastAPI `app` for hosts that expect `app:app`; the real code lives in `backend/backend_api.py`. |
| `requirements-api.txt` | active backend | Python dependencies for the FastAPI backend. |
| `Dockerfile` | active deployment | Container build for the Railway/container backend. |
| `Procfile` | active deployment | Procfile command for platforms that use `web:` process definitions. |
| `nixpacks.toml` | active deployment | Railway/Nixpacks backend start command. |
| `amplify.yml` | active deployment | Amplify build file for the frontend app. |
| `.gitignore` | active config | Keeps local databases, env files, caches, and build output out of GitHub. |
| `.dockerignore` | active config | Keeps unnecessary files out of backend container builds. |
| `.railwayignore` | active config | Keeps frontend build output, caches, and legacy files out of Railway uploads. |

## Backend

| File | Status | Purpose |
| --- | --- | --- |
| `backend/backend_api.py` | active | FastAPI routes, upload handling, ranking orchestration, auth endpoints, saved jobs, account deletion, and response metadata. |
| `backend/resume_utils.py` | active | Validates uploaded resumes, extracts PDF/DOCX/TXT text, normalizes text, and creates structured resume data. |
| `backend/simplify_fetcher.py` | active | Fetches and parses SimplifyJobs/Jobright markdown and HTML job tables. |
| `backend/matcher.py` | active | Deterministic ranking formula for keyword similarity, skill overlap, role fit, location, and freshness. |
| `backend/skills.py` | active | Skill dictionary, aliases, and skill extraction helpers. |
| `backend/gemini_recommender.py` | active | Optional Gemini scoring/recommendation layer with retry, schema validation, and safe fallback behavior. |
| `backend/jobfit_db.py` | active | Storage facade. Uses Supabase when configured, otherwise local SQLite. |
| `backend/supabase_store.py` | active | Supabase REST/Auth integration for users, sessions, resumes, match runs, saved jobs, and job cache. |
| `backend/job_scout.py` | active small helper | Marks newly seen jobs and generates stable job IDs. |
| `backend/__init__.py` | active | Marks backend as an importable Python package. |

## Frontend

| File or Folder | Status | Purpose |
| --- | --- | --- |
| `frontend/app/` | active | Next.js App Router pages: landing, dashboard, upload, account, saved jobs, about, and match details. |
| `frontend/components/` | active | Reusable UI components such as navbar, upload box, match cards, saved job controls, loading states, and account screens. |
| `frontend/lib/jobfit-api.ts` | active | Browser API client for FastAPI proxy calls and Supabase Auth signup/login/logout bridge. |
| `frontend/lib/mock-data.ts` | active fallback | Shared types and limited mock data for empty/demo states. |
| `frontend/app/globals.css` | active style | Global Tailwind styles and theme polish. |
| `frontend/package.json` | active frontend | Next.js dependencies and scripts. |

## Tests

| File | Status | Purpose |
| --- | --- | --- |
| `tests/test_backend_api.py` | test | API-level behavior for ranking, saved jobs, auth, and metadata. |
| `tests/test_resume_utils.py` | test | Upload validation and structured resume extraction. |
| `tests/test_gemini_recommender.py` | test | Gemini prompt/output fallback and retry behavior. |
| `tests/test_jobfit_db.py` | test | SQLite storage, saved data, and account deletion behavior. |
| `tests/test_supabase_store.py` | test | Supabase request mapping and Supabase Auth token bridging. |
| `tests/test_simplify_fetcher.py` | test | Job table parsing against changing markdown/HTML formats. |
| `tests/test_matcher.py` | test | Ranking order and scoring behavior. |
| `tests/test_skills.py` | test | Skill extraction and aliases. |
| `tests/test_job_scout.py` | test | New-job marking and stable job IDs. |

## Docs

| File | Status | Purpose |
| --- | --- | --- |
| `docs/architecture.md` | docs | Main system flows and how the pieces fit together. |
| `docs/environment.md` | docs | Environment variable reference. |
| `docs/production-readiness.md` | docs | What is production-ready, partial, and still left. |
| `docs/supabase-schema.sql` | docs/schema | Supabase table setup and RLS hardening statements. |

## Legacy

| Folder | Status | Purpose |
| --- | --- | --- |
| `legacy/streamlit/` | legacy | Original Streamlit MVP and local CSV saved-job code. Preserved for reference only. |
| `legacy/us-job-finder/` | legacy | Disabled external job finder experiment. Not part of active product. |
| `legacy/deployment-experiments/` | legacy | AWS/ECS/Render deployment experiments and workflow drafts. Preserved as notes, not active deployment. |
