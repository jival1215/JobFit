# AWS Deployment Guide

This repo is prepared for a two-service AWS deployment:

- Frontend: AWS Amplify Hosting from the `frontend/` app.
- Backend: AWS App Runner from the root `Dockerfile`.

## Backend: AWS App Runner

1. Open AWS App Runner and create a service.
2. Choose source from GitHub and select `jival1215/JobFit`.
3. Use the root `Dockerfile`.
4. Set the service port to `8080`.
5. Add environment variables:

```bash
PORT=8080
FRONTEND_ORIGINS=https://YOUR_AMPLIFY_DOMAIN.amplifyapp.com
ENABLE_GEMINI_RECOMMENDATIONS=false
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

6. Deploy and copy the App Runner service URL. It will look like:

```text
https://xxxxxxxx.us-east-1.awsapprunner.com
```

7. Confirm the backend works:

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

## Notes

The backend still uses local CSV files for saved/seen job state. On App Runner, local files are ephemeral, so status tracking is not durable across redeploys. For production durability, move saved/applied/skipped jobs to DynamoDB, RDS, or S3.
