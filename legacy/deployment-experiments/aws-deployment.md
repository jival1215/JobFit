> Legacy reference only. The active production path is Amplify frontend + Railway backend + Supabase storage/Auth.

# AWS Deployment Guide

This repo is prepared for a staged AWS deployment using current AWS guidance:

- Frontend: AWS Amplify Hosting from the `frontend/` app.
- Backend: Amazon ECS Express Mode running the root `Dockerfile` on Fargate.
- Container registry: Amazon ECR.
- Local development database: SQLite via `jobfit_db.py`.
- Production database target: Amazon RDS PostgreSQL plus Cognito once we wire the production auth layer.

AWS App Runner is no longer the recommended path for new customers. ECS Express Mode keeps the simple managed-container experience while creating visible ECS/Fargate, load balancer, auto scaling, monitoring, and networking resources in your AWS account.

## Backend: ECS Express Mode

### 1. Create ECR Repository

Create an Amazon ECR repository named:

```text
jobfit-api
```

Build and push the root Docker image to ECR. You can do this manually first, then automate it with GitHub Actions.

### 2. Create Required IAM Roles

ECS Express Mode needs two roles:

- `ecsTaskExecutionRole`
- `ecsInfrastructureRoleForExpressServices`

The ECS Express Mode console can help create or select these roles.

### 3. Create ECS Express Mode Service

Open Amazon ECS, choose Express Mode, and create a service using the ECR image.

Recommended settings:

```text
Service name: jobfit-api
Container port: 8080
Health check path: /api/health
CPU: 1 vCPU
Memory: 2 GB
Min tasks: 1
Max tasks: 4
```

Environment variables:

```bash
PORT=8080
FRONTEND_ORIGINS=https://YOUR_AMPLIFY_DOMAIN.amplifyapp.com
FRONTEND_ORIGIN_REGEX=https://.*\.amplifyapp\.com
ENABLE_GEMINI_RECOMMENDATIONS=true
GEMINI_MODEL=gemini-2.5-flash
GEMINI_RECOMMENDATION_LIMIT=5
GEMINI_RECRUITER_TARGET_SIZE=10
GEMINI_RECRUITER_BATCH_SIZE=5
GEMINI_RECRUITER_MAX_CANDIDATES=25
GEMINI_RECRUITER_SCORE_WEIGHT=0.20
```

Add `GEMINI_API_KEY` as a secret/environment variable in AWS. Do not commit it to GitHub.

### 4. Test Backend

After ECS Express Mode creates the service, copy the public service URL and verify:

```bash
curl https://YOUR_ECS_EXPRESS_URL/api/health
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
NEXT_PUBLIC_JOBFIT_API_URL=https://YOUR_ECS_EXPRESS_URL
```

5. Deploy the Amplify app.
6. Copy the Amplify domain and add it to the backend `FRONTEND_ORIGINS` variable.
7. Redeploy or restart the backend after changing CORS variables.

## Optional GitHub Actions Deployment

This repo includes `.github/workflows/deploy-ecs-express.yml` as a manual workflow starter. It builds the backend Docker image, pushes it to ECR, and deploys to ECS Express Mode.

Before running it, configure GitHub repository variables:

```text
AWS_REGION
AWS_ACCOUNT_ID
ECR_REPOSITORY
ECS_SERVICE
ECS_CLUSTER
```

Configure GitHub repository secrets:

```text
AWS_ROLE_TO_ASSUME
GEMINI_API_KEY
FRONTEND_ORIGINS
```

The recommended AWS auth method is GitHub OIDC into an IAM role, not long-lived AWS access keys.

## Local Docker Test

From the repo root:

```bash
docker build -t jobfit-api .
docker run --rm -p 8080:8080 -e PORT=8080 jobfit-api
curl http://127.0.0.1:8080/api/health
```

## Production Database Next Step

The local account system uses SQLite so we can build quickly. Before using real users in AWS, move persistence to RDS PostgreSQL:

1. Create an RDS PostgreSQL instance in the same region as ECS Express Mode.
2. Store the database URL in AWS Secrets Manager or ECS environment variables.
3. Replace the SQLite adapter in `jobfit_db.py` with the PostgreSQL adapter.
4. Switch auth to Cognito for production login.
5. Redeploy ECS Express Mode and verify `/api/auth/register`, `/api/auth/login`, `/api/saved-matches`, and `/api/rank`.

## Notes

Do not commit API keys or database passwords. Use AWS Secrets Manager, SSM Parameter Store, ECS secrets, or GitHub Actions secrets for `GEMINI_API_KEY` and database credentials.


## Account and Resume Storage

The current MVP stores users, sessions, resume records, match runs, saved jobs, and recommendation payloads through `jobfit_db.py`. In local development this uses SQLite. On AWS, do not store real user data in disposable container storage long term. Use one of these paths before production users:

- Short MVP path: mount persistent encrypted storage and set `JOBFIT_DB_PATH` to that mount.
- Production path: move accounts to Cognito, structured data to RDS PostgreSQL, and original resume files to encrypted S3.

Set `JOBFIT_ENCRYPTION_KEY` as an AWS secret or environment variable so stored resume files and extracted text are encrypted by the app before being written. Generate it with:

```bash
python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```
