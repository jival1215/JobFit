FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-api.txt ./
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements-api.txt

COPY backend_api.py app.py job_scout.py matcher.py resume_utils.py saved_jobs.py simplify_fetcher.py skills.py us_job_finder_fetcher.py ./

EXPOSE 8080

CMD ["sh", "-c", "uvicorn backend_api:app --host 0.0.0.0 --port ${PORT:-8080}"]
