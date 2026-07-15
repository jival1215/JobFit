# JobFIT

JobFIT is an AI-assisted job-matching platform for students and early-career candidates. Upload a resume, refresh real SimplifyJobs postings, rank opportunities by recruiter-style fit, and save the matches you want to track.

The current product has a Next.js frontend, FastAPI backend, optional Gemini recruiter review, and account storage that can run on local SQLite or Supabase for hosted users, resumes, saved jobs, and recommendation history.

## Live Links

- Web app: https://main.d8rnzmcb1hxs.amplifyapp.com
- Backend API: https://jobfit-api-production.up.railway.app
- API health check: https://jobfit-api-production.up.railway.app/api/health

## Features

- Upload resumes as PDF, DOCX, or TXT.
- Extract resume text locally.
- Fetch postings from SimplifyJobs and Jobright GitHub job repositories.
- Parse changing GitHub markdown/HTML job tables, including Simplify HTML tables and Jobright markdown tables.
- Cache parsed job postings in SQLite or Supabase so resume scans can rank from stored rows instead of re-fetching every repo each time.
- Extract company, role, location, application link, age, and category.
- Rank jobs using keyword similarity, skill overlap, role title fit, location preference, and posting freshness.
- Show Top 10 Apply First jobs.
- Show missing skills to learn.
- Show resume tailoring tips per job.
- Filter by role, location, company, and minimum score.
- Export ranked results to CSV.
- Create user accounts and sign in with token-based auth.
- Store first and last name on signup so the dashboard can greet users by name instead of email.
- Save uploaded resume records, match runs, recommendations, and user-specific Saved, Applied, and Skipped jobs.
- Reuse saved resumes for future scans without uploading the same file again.
- Use local SQLite for development or Supabase for hosted account/resume/recommendation storage.
- Optionally encrypt stored resume files and extracted resume text with `JOBFIT_ENCRYPTION_KEY`.
- Optional Gemini recruiter review that reranks the strongest candidates and enhances recommendation text.

## Local Setup

Backend:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-api.txt
uvicorn backend_api:app --reload --port 8000
```

Frontend:

```bash
cd frontend
npm install
NEXT_PUBLIC_JOBFIT_API_URL=http://127.0.0.1:8000 npm run dev
```

Local accounts, stored resume records, saved matches, and match runs are stored in `jobfit_local.db` by default. If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, the backend stores account data in Supabase instead. To use a different local database path:

```bash
JOBFIT_DB_PATH=/path/to/jobfit_local.db uvicorn backend_api:app --reload --port 8000
```

To encrypt stored resume files and extracted resume text, create a Fernet key and set it as an environment variable before starting the backend:

```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
JOBFIT_ENCRYPTION_KEY=your_generated_key uvicorn backend_api:app --reload --port 8000
```

## Testing

```bash
python3 -m unittest discover -s tests
```

## Project Structure

```text
JobFit/
  backend_api.py
  app.py
  frontend/
    app/
    components/
    lib/
  simplify_fetcher.py
  resume_utils.py
  matcher.py
  skills.py
  jobfit_db.py
  supabase_store.py
  gemini_recommender.py
  docs/
    supabase-schema.sql
    aws-deployment.md
  saved_jobs.py
  requirements.txt
  requirements-api.txt
  README.md
  tests/
    test_matcher.py
    test_simplify_fetcher.py
    test_skills.py
```

## Notes

The default product source is `All job repos`, which combines these GitHub-backed feeds:

```text
SimplifyJobs/Summer2026-Internships README.md
SimplifyJobs/Summer2026-Internships README-Off-Season.md
SimplifyJobs/New-Grad-Positions README.md
jobright-ai/2026-Data-Analysis-New-Grad README.md
jobright-ai/2026-Software-Engineer-New-Grad README.md
jobright-ai/2026-Product-Management-Internship README.md
jobright-ai/2026-Software-Engineer-Internship README.md
jobright-ai/2026-Public-Sector-Internship README.md
```

The backend caches parsed postings per source in `job_cache` / `jobfit_job_cache`. Set `JOBFIT_JOB_CACHE_TTL_MINUTES` to control refresh frequency. The default is 360 minutes.

## Deployment

### AWS

This repo is now prepared to host both sides on AWS:

- Frontend: AWS Amplify Hosting using `amplify.yml`.
- Backend: Amazon ECS Express Mode using the root `Dockerfile` and `requirements-api.txt`.

See `docs/aws-deployment.md` for the ECS Express Mode and Amplify deployment checklist.

### Railway + Supabase

Railway can host the FastAPI backend from this repo using `nixpacks.toml` and `requirements-api.txt`. Supabase can store accounts, sessions, resume records, match runs, saved jobs, cached job postings, and recommendation payloads. Run `docs/supabase-schema.sql` in the Supabase SQL editor, then set these Railway variables:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_TABLE_PREFIX=jobfit_
JOBFIT_JOB_CACHE_TTL_MINUTES=360
JOBFIT_ENCRYPTION_KEY=your_fernet_key
GEMINI_API_KEY=your_gemini_key
ENABLE_GEMINI_RECOMMENDATIONS=true
FRONTEND_ORIGINS=https://main.d8rnzmcb1hxs.amplifyapp.com,http://localhost:3000,http://127.0.0.1:3000
```

Keep `SUPABASE_SERVICE_ROLE_KEY` server-side only. Do not put it in the Next.js frontend. Generate `JOBFIT_ENCRYPTION_KEY` with:

```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### Other Hosts

The FastAPI backend lives in `backend_api.py`. Auth, stored resume records, saved matches, and match-run recommendation history live in `jobfit_db.py`, which automatically uses Supabase when configured and SQLite otherwise. For deployment hosts that auto-detect `app.py`, this repo includes a tiny `app.py` shim that exposes `backend_api.app`. The legacy Streamlit UI is preserved as `streamlit_app.py`. You can still set the backend start command explicitly:

```bash
uvicorn backend_api:app --host 0.0.0.0 --port $PORT
```

For Render, this repo includes `render.yaml` with that command. For Procfile-based hosts, this repo includes:

```bash
web: uvicorn backend_api:app --host 0.0.0.0 --port $PORT
```

The Next.js frontend should be deployed from the `frontend/` directory and configured with:

```bash
NEXT_PUBLIC_JOBFIT_API_URL=https://jobfit-api-production.up.railway.app
```


Account/resume storage settings:

```bash
# SQLite fallback
JOBFIT_DB_PATH=jobfit_local.db

# Supabase hosted storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_TABLE_PREFIX=jobfit_

# Shared account settings
JOBFIT_SESSION_DAYS=14
JOBFIT_ENCRYPTION_KEY=your_fernet_key
```

Optional Gemini recommendation settings for the backend:

```bash
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
ENABLE_GEMINI_RECOMMENDATIONS=true
GEMINI_RECOMMENDATION_LIMIT=5
GEMINI_RECRUITER_TARGET_SIZE=10
GEMINI_RECRUITER_MAX_CANDIDATES=25
GEMINI_RECRUITER_SCORE_WEIGHT=0.20
```

