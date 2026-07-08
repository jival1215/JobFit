# AWS Deployment Guide

This repo is prepared for a staged AWS deployment:

- Frontend: AWS Amplify Hosting from the `frontend/` app.
- Backend: AWS App Runner from the root `Dockerfile`.
- Local development database: SQLite via `jobfit_db.py`.
- Production database target: Amazon RDS PostgreSQL plus Cognito once we wire the production auth layer.

## Backend: AWS App Runner

1. Open AWS App Runner and create a service.
2. Choose source from GitHub and select `jival1215/JobFit`.
3. Use the root `Dockerfile`.
4. Set the service port to `8080`.
5. Add environment variables:

```bash
PORT=8080
FRONTEND_ORIGINS=https://YOUR_AMPLIFY_DOMAIN.amplifyapp.com
ENABLE_GEMINI_RECOMMENDATIONS=true
GEMINI_MODEL=gemini-2.5-flash
GEMINI_RECOMMENDATION_LIMIT=5
GEMINI_RECRUITER_TARGET_SIZE=10
GEMINI_RECRUITER_MAX_CANDIDATES=25
GEMINI_RECRUITER_SCORE_WEIGHT=0.20
```

To enable Gemini recommendation text, add your Google AI Studio key and set `ENABLE_GEMINI_RECOMMENDATIONS=true`:

```bash
GEMINI_API_KEY=your_key_here
```

Optional for Amplify preview branches:

```bash
FRONTEND_ORIGIN_REGEX=https://.*\.amplifyapp\.com
```

6. For the current local-account version, App Runner will use its container filesystem for SQLite if `JOBFIT_DB_PATH` is not set. This is acceptable only for a first smoke test because App Runner storage is not durable across redeploys. For real user accounts, create RDS PostgreSQL before making this public.
7. Deploy and copy the App Runner service URL. It will look like:

```text
https://xxxxxxxx.us-east-1.awsapprunner.com
```

8. Confirm the backend works:

```bash
curl https://YOUR_APP_RUNNER_URL/api/health
```

Expected response:

```json
{"status":"ok"}
```

## Frontend: AWS Amplify Hosting

1. Open AWS Amplify and create a new app from GitHub.
2. Select `jival1215/JobFit`.
3. Use the root `amplify.yml` build spec. It points Amplify at `frontend/`.
4. Add the frontend environment variable:

```bash
NEXT_PUBLIC_JOBFIT_API_URL=https://YOUR_APP_RUNNER_URL
```

5. Deploy the Amplify app.
6. Copy the Amplify domain and add it to the App Runner backend `FRONTEND_ORIGINS` variable.
7. Redeploy or restart the backend service after changing CORS variables.

## Local Docker Test

From the repo root:

```bash
docker build -t jobfit-api .
docker run --rm -p 8080:8080 -e PORT=8080 jobfit-api
curl http://127.0.0.1:8080/api/health
```

## Production Database Next Step

The local account system uses SQLite so we can build quickly. Before using real users in AWS, move persistence to RDS PostgreSQL:

1. Create an RDS PostgreSQL instance in the same region as App Runner.
2. Store the database URL in AWS Secrets Manager or App Runner environment variables.
3. Replace the SQLite adapter in `jobfit_db.py` with the PostgreSQL adapter.
4. Keep auth temporary for local testing, or switch auth to Cognito for production login.
5. Redeploy App Runner and verify `/api/auth/register`, `/api/auth/login`, `/api/saved-matches`, and `/api/rank`.

## Notes

Do not commit API keys or database passwords. Use App Runner environment variables, Secrets Manager, or SSM Parameter Store for `GEMINI_API_KEY` and database credentials.
