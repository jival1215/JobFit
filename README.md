# JobFIT

JobFIT is an AI-assisted job-matching platform for students and early-career candidates. Upload a resume, refresh real SimplifyJobs postings, rank opportunities by recruiter-style fit, and save the matches you want to track.

The current product has a Next.js frontend, FastAPI backend, optional Gemini recruiter review, and a local SQLite account database that is designed to migrate cleanly to AWS Cognito plus RDS PostgreSQL.

## Live Links

- Web app: https://jobfit-ebon.vercel.app
- Backend API: https://jobfit-api-production.up.railway.app
- API health check: https://jobfit-api-production.up.railway.app/api/health

## Features

- Upload resumes as PDF, DOCX, or TXT.
- Extract resume text locally.
- Fetch postings from the SimplifyJobs Summer 2026 internships repo.
- Parse changing GitHub markdown/HTML job tables.
- Extract company, role, location, application link, age, and category.
- Rank jobs using keyword similarity, skill overlap, role title fit, location preference, and posting freshness.
- Show Top 10 Apply First jobs.
- Show missing skills to learn.
- Show resume tailoring tips per job.
- Filter by role, location, company, and minimum score.
- Export ranked results to CSV.
- Create local user accounts and sign in with token-based auth.
- Save match runs and user-specific Saved, Applied, and Skipped jobs in SQLite.
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

Local accounts and saved matches are stored in `jobfit_local.db` by default. To use a different local database path:

```bash
JOBFIT_DB_PATH=/path/to/jobfit_local.db uvicorn backend_api:app --reload --port 8000
```

## Testing

```bash
python3 -m unittest discover
```

## Project Structure

```text
jobfit_simplify_mvp/
  app.py
  simplify_fetcher.py
  resume_utils.py
  matcher.py
  skills.py
  saved_jobs.py
  jobfit_db.py
  requirements.txt
  README.md
  tests/
    test_matcher.py
    test_simplify_fetcher.py
    test_skills.py
```

## Notes

The default source is:

```text
https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md
```

You can paste another compatible SimplifyJobs raw README URL in the sidebar, such as an off-season or new-grad list.

## Deployment

### AWS

This repo is now prepared to host both sides on AWS:

- Frontend: AWS Amplify Hosting using `amplify.yml`.
- Backend: AWS App Runner using the root `Dockerfile` and `requirements-api.txt`.

See `docs/aws-deployment.md` for the full AWS migration checklist.

### Other Hosts

The FastAPI backend lives in `backend_api.py`. Local auth and saved matches live in `jobfit_db.py` using SQLite. In AWS, this layer should move to Cognito for auth and RDS PostgreSQL for persistence. For deployment hosts that auto-detect `app.py`, this repo now includes a tiny `app.py` shim that exposes `backend_api.app`. The legacy Streamlit UI is preserved as `streamlit_app.py`. You can still set the backend start command explicitly:

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

