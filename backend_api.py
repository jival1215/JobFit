from __future__ import annotations

import json
import hashlib
import os
import re
from datetime import datetime, timezone
from io import BytesIO
from typing import Any

import pandas as pd
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from gemini_recommender import enrich_ranked_with_gemini, gemini_enabled, rerank_top_matches_with_recruiter_agent
from job_scout import mark_new_jobs
from jobfit_db import (
    authenticate_user,
    create_session,
    create_user,
    delete_resume_record,
    delete_saved_match,
    delete_session,
    encryption_enabled,
    get_resume_record,
    list_match_runs,
    list_resumes,
    list_saved_matches,
    save_match_run,
    save_resume_record,
    save_user_match,
    saved_status_map,
    storage_backend,
    user_from_token,
    user_summary,
)
from matcher import rank_jobs
from resume_utils import extract_resume_text
from saved_jobs import load_statuses, merge_statuses, save_job_status, tracker_summary
from simplify_fetcher import JOB_SOURCES, fetch_markdown, parse_simplify_jobs


app = FastAPI(title="JobFIT API", version="0.1.0")


def _bearer_token(authorization: str | None) -> str:
    if not authorization:
        return ""
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return ""
    return token.strip()


def _optional_user(authorization: str | None) -> dict[str, Any] | None:
    return user_from_token(_bearer_token(authorization))


def _required_user(authorization: str | None) -> dict[str, Any]:
    user = _optional_user(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Sign in required")
    return user


def _cors_origins() -> list[str]:
    defaults = [
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "https://jobfit-ebon.vercel.app",
        "https://jobfit-q3g08x4sn-jp-projects2.vercel.app",
        "https://main.d8rnzmcb1hxs.amplifyapp.com",
    ]
    configured = [
        origin.strip()
        for origin in os.getenv("FRONTEND_ORIGINS", "").split(",")
        if origin.strip()
    ]
    return [*defaults, *configured]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_origin_regex=os.getenv("FRONTEND_ORIGIN_REGEX") or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UploadedResume:
    def __init__(self, name: str, data: bytes):
        self.name = name
        self._buffer = BytesIO(data)

    def read(self) -> bytes:
        return self._buffer.read()


def _split_skills(value: Any) -> list[str]:
    return [item.strip() for item in str(value or "").split(",") if item.strip()]


def _split_json_or_csv(value: Any) -> list[str]:
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    text = str(value or "").strip()
    if not text:
        return []
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        return _split_skills(text)
    if isinstance(parsed, list):
        return [str(item).strip() for item in parsed if str(item).strip()]
    return _split_skills(text)


def _job_type(source: str) -> str:
    if "full" in source.lower():
        return "New Grad"
    if "fall" in source.lower() or "off" in source.lower():
        return "Co-op"
    return "Internship"


def _safe_job_id(row: pd.Series, index: int) -> str:
    raw_id = str(row.get("job_id", "")) or f"job-{index}"
    readable = f"{row.get('company', '')}-{row.get('role', '')}".lower()
    slug = re.sub(r"[^a-z0-9]+", "-", readable).strip("-") or "job"
    digest = hashlib.sha1(raw_id.encode("utf-8")).hexdigest()[:10]
    return f"{slug[:72].strip('-')}-{digest}"


def _title_keywords(title: str) -> list[str]:
    stopwords = {"intern", "internship", "co", "op", "new", "grad", "early", "career", "engineer", "analyst", "associate"}
    words = re.findall(r"[a-zA-Z][a-zA-Z+/#.-]*", title.lower())
    return [word for word in words if len(word) > 2 and word not in stopwords][:5]


def _resume_bullet_candidates(resume_text: str) -> list[str]:
    candidates: list[str] = []
    for raw_line in resume_text.splitlines():
        line = re.sub(r"\s+", " ", raw_line).strip(" -•*\t")
        if len(line) < 35 or len(line) > 260:
            continue
        if re.search(r"@|linkedin|github|education|experience|projects|skills|coursework", line, flags=re.I):
            continue
        if line.lower() in {item.lower() for item in candidates}:
            continue
        candidates.append(line)
    return candidates[:30]


def _score_resume_bullet(bullet: str, keywords: list[str]) -> int:
    lower = bullet.lower()
    score = 0
    for keyword in keywords:
        keyword = keyword.lower().strip()
        if keyword and keyword in lower:
            score += 3 if " " in keyword else 2
    if re.search(r"\b\d+[%,]?|\$|\b(users?|records?|documents?|rows?|hours?|minutes?)\b", lower):
        score += 1
    return score


def _resume_bullet_guidance(row: pd.Series, resume_text: str) -> list[dict[str, str]]:
    bullets = _resume_bullet_candidates(resume_text)
    if not bullets:
        return []

    role = str(row.get("role", "this role"))
    matched = _split_skills(row.get("matched_skills", ""))
    missing = _split_skills(row.get("missing_skills", ""))
    title_keywords = _title_keywords(role)
    keywords = [*matched, *missing, *title_keywords]
    ranked_bullets = sorted(
        ((bullet, _score_resume_bullet(bullet, keywords)) for bullet in bullets),
        key=lambda item: item[1],
        reverse=True,
    )
    selected = [bullet for bullet, score in ranked_bullets if score > 0][:3] or [bullet for bullet, _ in ranked_bullets[:3]]

    target_keywords = []
    for keyword in [*matched[:4], *title_keywords[:3], *missing[:2]]:
        if keyword and keyword.lower() not in {item.lower() for item in target_keywords}:
            target_keywords.append(keyword)
    keyword_text = ", ".join(target_keywords[:6]) or role

    suggestions: list[dict[str, str]] = []
    for bullet in selected:
        has_metric = bool(re.search(r"\b\d+[%,]?|\$|\b(users?|records?|documents?|rows?|hours?|minutes?)\b", bullet.lower()))
        if has_metric:
            suggestion = (
                f"Keep the metric, but rewrite this bullet to connect more directly to {role}. "
                f"Work in {keyword_text} where truthful and make the outcome obvious."
            )
        else:
            suggestion = (
                f"Rewrite this bullet for {role} by adding a concrete result and naming {keyword_text} where truthful. "
                "Use a number if you can support it."
            )

        reason = "This looks like one of the resume lines most related to the job keywords and should carry more of the match signal."
        if missing:
            reason += f" It can also help address gaps around {', '.join(missing[:2])} if those skills are truthful for you."

        suggestions.append({"current": bullet, "suggestion": suggestion, "reason": reason})

    return suggestions


def _resume_change_guidance(row: pd.Series) -> dict[str, list[str]]:
    role = str(row.get("role", "this role"))
    matched = _split_skills(row.get("matched_skills", ""))
    missing = _split_skills(row.get("missing_skills", ""))
    title_keywords = _title_keywords(role)
    matched_text = ", ".join(matched[:4]) or "your strongest relevant technical skills"
    missing_text = ", ".join(missing[:4])
    role_keyword_text = ", ".join(title_keywords) or role

    resume_changes = [
        f"Tune your resume headline or summary toward {role} by using role keywords like {role_keyword_text} where truthful.",
        f"Move the most relevant project higher and make the first bullet mention {matched_text}.",
        "Rewrite one project bullet to include a measurable result, dataset size, accuracy, automation time saved, or dashboard/business impact.",
    ]
    if missing_text:
        resume_changes.append(f"Add a small coursework, project, or tools line for these gaps only if true: {missing_text}.")
    else:
        resume_changes.append("You do not have major extracted skill gaps, so spend the tailoring effort on clearer impact metrics and role wording.")

    resume_keywords = []
    for skill in [*matched[:5], *missing[:4], *title_keywords]:
        if skill and skill.lower() not in {item.lower() for item in resume_keywords}:
            resume_keywords.append(skill)

    suggested_experience = [
        f"Lead with a project or work bullet that proves {matched_text}.",
        "Highlight dashboards, databases, AI/ML, analytics, or API work that maps directly to the job title.",
    ]
    if missing:
        suggested_experience.append(f"If you have it, add evidence for {missing[0]} through coursework, a mini-project, or a deployment note.")

    return {
        "resumeChanges": resume_changes,
        "resumeKeywords": resume_keywords,
        "suggestedExperience": suggested_experience,
    }


def _ai_recommendations(row: pd.Series) -> dict[str, Any]:
    raw = row.get("ai_recommendations", "")
    if not raw:
        return {}
    try:
        parsed = json.loads(str(raw))
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _records_from_ranked(ranked: pd.DataFrame, resume_text: str = "") -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for index, row in ranked.reset_index(drop=True).iterrows():
        job_id = str(row.get("job_id", "")) or f"job-{index}"
        guidance = _resume_change_guidance(row)
        ai_guidance = _ai_recommendations(row)
        bullet_guidance = ai_guidance.get("resumeBulletChanges") or _resume_bullet_guidance(row, resume_text)
        improvement_tips = ai_guidance.get("improvementTips") or [
            part.strip() for part in str(row.get("tailoring_tips", "")).split(".") if part.strip()
        ]
        match_explanation = str(ai_guidance.get("matchExplanation") or row.get("match_explanation", ""))
        personalized_summary = str(ai_guidance.get("personalizedSummary") or row.get("match_explanation", ""))
        records.append(
            {
                "id": _safe_job_id(row, index),
                "backendId": job_id,
                "company": str(row.get("company", "")),
                "title": str(row.get("role", "")),
                "role": str(row.get("role", "")),
                "location": str(row.get("location", "")),
                "type": _job_type(str(row.get("source", ""))),
                "score": float(row.get("match_score", 0) or 0),
                "deterministicScore": float(row.get("deterministic_match_score", row.get("match_score", 0)) or 0),
                "recommendation": str(row.get("recommendation", "")),
                "source": str(row.get("source", "")),
                "posted": str(row.get("age", "")) or "Unknown",
                "applicationLink": str(row.get("application_link", "")),
                "applyUrl": str(row.get("application_link", "")),
                "matchScore": float(row.get("match_score", 0) or 0),
                "aiRecruiterRelatednessScore": float(row.get("ai_recruiter_relatedness_score", 0) or 0),
                "aiRecruiterReasoning": str(row.get("ai_recruiter_reasoning", "")),
                "aiRecruiterEvidence": _split_json_or_csv(row.get("ai_recruiter_evidence", "")),
                "aiRecruiterConcerns": _split_json_or_csv(row.get("ai_recruiter_concerns", "")),
                "aiRecruiterProvider": str(row.get("ai_recruiter_provider", "")),
                "matchedSkills": _split_skills(row.get("matched_skills", "")),
                "missingSkills": _split_skills(row.get("missing_skills", "")),
                "summary": personalized_summary,
                "personalizedSummary": personalized_summary,
                "matchExplanation": match_explanation,
                "improvements": improvement_tips,
                "improvementTips": improvement_tips,
                "applyPlan": str(row.get("apply_plan", "")),
                **guidance,
                "resumeKeywords": ai_guidance.get("resumeKeywords") or guidance["resumeKeywords"],
                "suggestedExperience": ai_guidance.get("suggestedExperience") or guidance["suggestedExperience"],
                "resumeBulletChanges": bullet_guidance,
                "aiEnhanced": bool(ai_guidance),
                "aiProvider": str(row.get("ai_recommendations_provider", "")),
                "scoreBreakdown": str(row.get("score_breakdown", "")),
                "isNew": bool(row.get("is_new", False)),
                "status": str(row.get("status", "")),
                "notes": str(row.get("notes", "")),
                "appliedDate": str(row.get("applied_date", "")),
                "followUpDate": str(row.get("follow_up_date", "")),
            }
        )
    return records


@app.post("/api/auth/register")
def register(payload: dict[str, Any]) -> dict[str, Any]:
    try:
        user = create_user(str(payload.get("email", "")), str(payload.get("password", "")))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    token = create_session(int(user["id"]))
    return {"token": token, "user": user}


@app.post("/api/auth/login")
def login(payload: dict[str, Any]) -> dict[str, Any]:
    user = authenticate_user(str(payload.get("email", "")), str(payload.get("password", "")))
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_session(int(user["id"]))
    return {"token": token, "user": user}


@app.get("/api/auth/me")
def me(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    user = _required_user(authorization)
    user_id = int(user["id"])
    return {
        "user": user,
        "summary": user_summary(user_id),
        "matchRuns": list_match_runs(user_id),
        "resumes": list_resumes(user_id),
        "resumeEncryptionEnabled": encryption_enabled(),
    }


@app.post("/api/auth/logout")
def logout(authorization: str | None = Header(default=None)) -> dict[str, str]:
    token = _bearer_token(authorization)
    if token:
        delete_session(token)
    return {"status": "signed out"}


@app.get("/api/resumes")
def resumes(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    user = _required_user(authorization)
    return {
        "resumes": list_resumes(int(user["id"])),
        "encryptionEnabled": encryption_enabled(),
        "summary": user_summary(int(user["id"])),
    }


@app.get("/api/resumes/{resume_id}")
def resume_detail(
    resume_id: int,
    include_text: bool = False,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    user = _required_user(authorization)
    try:
        resume = get_resume_record(int(user["id"]), resume_id, include_text=include_text)
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return {"resume": resume}


@app.delete("/api/resumes/{resume_id}")
def remove_resume(resume_id: int, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    user = _required_user(authorization)
    delete_resume_record(int(user["id"]), resume_id)
    return {"status": "deleted", "summary": user_summary(int(user["id"]))}


@app.get("/api/saved-matches")
def saved_matches(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    user = _required_user(authorization)
    return {"jobs": list_saved_matches(int(user["id"])), "summary": user_summary(int(user["id"]))}


@app.post("/api/saved-matches")
def save_match(payload: dict[str, Any], authorization: str | None = Header(default=None)) -> dict[str, Any]:
    user = _required_user(authorization)
    job = payload.get("job") if isinstance(payload.get("job"), dict) else payload
    status = str(payload.get("status") or job.get("status") or "Saved")
    notes = str(payload.get("notes", ""))
    try:
        result = save_user_match(int(user["id"]), job, status, notes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"status": "saved", **result, "summary": user_summary(int(user["id"]))}


@app.delete("/api/saved-matches/{job_id}")
def remove_saved_match(job_id: str, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    user = _required_user(authorization)
    delete_saved_match(int(user["id"]), job_id)
    return {"status": "deleted", "summary": user_summary(int(user["id"]))}


@app.get("/")
def root() -> dict[str, Any]:
    return {
        "name": "JobFIT API",
        "status": "ok",
        "message": "This is the backend API. Deploy/open the Next.js frontend from the frontend directory to use the JobFIT website.",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "storage": storage_backend()}


@app.get("/api/sources")
def sources() -> dict[str, list[str]]:
    return {"sources": list(JOB_SOURCES.keys())}


@app.post("/api/rank")
async def rank_resume(
    resume: UploadFile = File(...),
    source: str = Form("Summer internships"),
    preferred_roles: str = Form('["data","data science","data engineering","ai/ml"]'),
    preferred_locations: str = Form("remote, nyc, new york, new jersey, nj, philadelphia, pa, united states, usa"),
    use_ai_recommendations: bool = Form(False),
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    if source not in JOB_SOURCES:
        raise HTTPException(status_code=400, detail=f"Unknown source: {source}")

    try:
        role_values = json.loads(preferred_roles)
        if not isinstance(role_values, list):
            role_values = []
    except json.JSONDecodeError:
        role_values = []

    location_values = [item.strip() for item in preferred_locations.split(",") if item.strip()]
    data = await resume.read()
    resume_text = extract_resume_text(UploadedResume(resume.filename or "resume", data))
    if not resume_text:
        raise HTTPException(status_code=422, detail="Could not extract text from resume")

    user = _optional_user(authorization)
    stored_resume = None
    if user:
        stored_resume = save_resume_record(
            int(user["id"]),
            resume.filename or "resume",
            resume.content_type or "application/octet-stream",
            data,
            resume_text,
        )

    source_url = JOB_SOURCES[source]
    fetched_at = datetime.now(timezone.utc).isoformat()
    markdown = fetch_markdown(source_url)
    jobs = parse_simplify_jobs(markdown)
    jobs["source"] = source
    jobs = mark_new_jobs(jobs, source)
    ranked = rank_jobs(resume_text, jobs, role_values, location_values)
    ai_recruiter_rerank_enabled = bool(use_ai_recommendations and gemini_enabled())
    if ai_recruiter_rerank_enabled:
        ranked = rerank_top_matches_with_recruiter_agent(
            ranked,
            resume_text,
            target_size=int(os.getenv("GEMINI_RECRUITER_TARGET_SIZE", "5") or 5),
            batch_size=int(os.getenv("GEMINI_RECRUITER_BATCH_SIZE", "5") or 5),
            max_candidates=int(os.getenv("GEMINI_RECRUITER_MAX_CANDIDATES", "5") or 5),
            ai_weight=float(os.getenv("GEMINI_RECRUITER_SCORE_WEIGHT", "0.20") or 0.20),
        )
        ranked = enrich_ranked_with_gemini(
            ranked,
            resume_text,
            int(os.getenv("GEMINI_RECOMMENDATION_LIMIT", "2") or 2),
        )
    if not user:
        ranked = merge_statuses(ranked, load_statuses())

    records = _records_from_ranked(ranked, resume_text)
    match_run_id = None
    if user:
        statuses = saved_status_map(int(user["id"]))
        for job in records:
            saved = statuses.get(str(job.get("backendId"))) or statuses.get(str(job.get("id")))
            if saved:
                job["status"] = saved["status"]
                job["notes"] = saved.get("notes", "")

    response_payload = {
        "source": source,
        "sourceUrl": source_url,
        "fetchedAt": fetched_at,
        "count": int(len(ranked)),
        "newCount": int(ranked.get("is_new", pd.Series(False, index=ranked.index)).sum()),
        "aiRecommendationsRequested": bool(use_ai_recommendations),
        "aiRecommendationsEnabled": bool(use_ai_recommendations and gemini_enabled()),
        "aiRecruiterRerankEnabled": ai_recruiter_rerank_enabled,
        "aiRecruiterReviewedCount": int(ranked.get("ai_recruiter_relatedness_score", pd.Series(dtype=float)).notna().sum()) if "ai_recruiter_relatedness_score" in ranked else 0,
        "aiEnhancedCount": sum(1 for job in records if job.get("aiEnhanced")),
        "jobs": records,
        "tracker": user_summary(int(user["id"])) if user else tracker_summary(load_statuses()),
        "user": user,
        "resume": stored_resume,
        "resumeId": stored_resume["id"] if stored_resume else None,
        "resumeEncryptionEnabled": bool(stored_resume and stored_resume.get("encrypted")),
        "matchRunId": match_run_id,
    }
    if user:
        if stored_resume:
            response_payload["resumeId"] = stored_resume["id"]
        match_run_id = save_match_run(int(user["id"]), response_payload)
        response_payload["matchRunId"] = match_run_id
        response_payload["tracker"] = user_summary(int(user["id"]))
    return response_payload


@app.get("/api/tracker")
def tracker(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    user = _optional_user(authorization)
    if user:
        return {"summary": user_summary(int(user["id"])), "jobs": list_saved_matches(int(user["id"]))}
    statuses = load_statuses()
    return {"summary": tracker_summary(statuses), "jobs": statuses.fillna("").to_dict(orient="records")}


@app.post("/api/status")
def update_status(payload: dict[str, Any], authorization: str | None = Header(default=None)) -> dict[str, Any]:
    status = str(payload.get("status", ""))
    job = {
        "company": payload.get("company", ""),
        "role": payload.get("role") or payload.get("title", ""),
        "location": payload.get("location", ""),
        "application_link": payload.get("applicationLink", ""),
    }
    user = _optional_user(authorization)
    if user:
        job_payload = dict(payload)
        job_payload.setdefault("backendId", payload.get("backendId") or payload.get("id") or "")
        job_payload.setdefault("company", job["company"])
        job_payload.setdefault("title", job["role"])
        job_payload.setdefault("location", job["location"])
        job_payload.setdefault("applyUrl", job["application_link"])
        result = save_user_match(int(user["id"]), job_payload, status, str(payload.get("notes", "")))
        return {"status": "saved", **result, "summary": user_summary(int(user["id"]))}

    save_job_status(
        job,
        status,
        str(payload.get("notes", "")),
        str(payload.get("appliedDate", "")),
        str(payload.get("followUpDate", "")),
    )
    return {"status": "saved"}
