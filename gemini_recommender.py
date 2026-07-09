from __future__ import annotations

import json
import os
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

import pandas as pd
import requests


DEFAULT_MODEL = "gemini-2.5-flash"
GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


def gemini_enabled() -> bool:
    value = os.getenv("ENABLE_GEMINI_RECOMMENDATIONS", "").strip().lower()
    return value in {"1", "true", "yes", "on"} and bool(os.getenv("GEMINI_API_KEY"))


def _as_list(value: Any, limit: int = 6) -> list[str]:
    if isinstance(value, list):
        items = value
    elif isinstance(value, str):
        items = re.split(r",|\n", value)
    else:
        items = []
    cleaned = [str(item).strip() for item in items if str(item).strip()]
    return cleaned[:limit]


def _resume_excerpt(resume_text: str, max_chars: int = 4500) -> str:
    text = re.sub(r"\s+", " ", resume_text).strip()
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rsplit(" ", 1)[0]


def _safe_json_loads(text: str) -> dict[str, Any]:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.I | re.S).strip()
    match = re.search(r"\{.*\}", text, flags=re.S)
    if match:
        text = match.group(0)
    parsed = json.loads(text)
    if not isinstance(parsed, dict):
        raise ValueError("Gemini response was not a JSON object")
    return parsed


def _sanitize_recommendations(payload: dict[str, Any]) -> dict[str, Any]:
    sanitized: dict[str, Any] = {}
    if payload.get("personalizedSummary"):
        sanitized["personalizedSummary"] = str(payload["personalizedSummary"]).strip()
    if payload.get("matchExplanation"):
        sanitized["matchExplanation"] = str(payload["matchExplanation"]).strip()

    for key, limit in {
        "improvementTips": 5,
        "resumeKeywords": 10,
        "suggestedExperience": 5,
    }.items():
        values = _as_list(payload.get(key), limit)
        if values:
            sanitized[key] = values

    bullet_changes = payload.get("resumeBulletChanges")
    if isinstance(bullet_changes, list):
        cleaned_changes = []
        for item in bullet_changes[:3]:
            if not isinstance(item, dict):
                continue
            current = str(item.get("current", "")).strip()
            suggestion = str(item.get("suggestion", "")).strip()
            reason = str(item.get("reason", "")).strip()
            if current and suggestion:
                cleaned_changes.append(
                    {
                        "current": current,
                        "suggestion": suggestion,
                        "reason": reason or "This bullet can carry more of the job-specific match signal.",
                    }
                )
        if cleaned_changes:
            sanitized["resumeBulletChanges"] = cleaned_changes

    return sanitized


def _build_prompt(row: pd.Series, resume_text: str) -> str:
    job = {
        "company": str(row.get("company", "")),
        "title": str(row.get("role", "")),
        "location": str(row.get("location", "")),
        "source": str(row.get("source", "")),
        "posted": str(row.get("age", "")),
        "matchScore": float(row.get("match_score", 0) or 0),
        "recommendation": str(row.get("recommendation", "")),
        "matchedSkills": _as_list(row.get("matched_skills", ""), 12),
        "missingSkills": _as_list(row.get("missing_skills", ""), 12),
        "existingExplanation": str(row.get("match_explanation", "")),
        "existingTailoringTips": str(row.get("tailoring_tips", "")),
    }
    return f"""
You are a concise career coach for an early-career CS student. Improve only the recommendation text for this job match.

Rules:
- Do not change the match score, recommendation, company, title, or skills.
- Do not invent experience, employers, metrics, certifications, or projects.
- Resume keywords must be suggested only if truthful.
- Keep advice practical, recruiter-style, and specific to this job.
- Return only valid JSON. No markdown.

Resume excerpt:
{_resume_excerpt(resume_text)}

Job match data:
{json.dumps(job, ensure_ascii=True)}

Return this JSON shape:
{{
  "personalizedSummary": "1 short sentence explaining the fit",
  "matchExplanation": "2-3 sentences explaining why this job fits the resume and what to watch out for",
  "improvementTips": ["specific application/resume tip", "specific application/resume tip"],
  "resumeKeywords": ["keyword to add if truthful"],
  "suggestedExperience": ["project or experience to highlight"],
  "resumeBulletChanges": [
    {{
      "current": "exact current resume bullet from the resume excerpt",
      "suggestion": "how to rewrite it for this job without inventing facts",
      "reason": "why this bullet matters for this role"
    }}
  ]
}}
""".strip()



def _score_schema() -> dict[str, Any]:
    return {
        "type": "OBJECT",
        "properties": {
            "recruiterRelatednessScore": {"type": "NUMBER"},
            "reasoning": {"type": "STRING"},
            "relatedEvidence": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
            },
            "concerns": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
            },
        },
        "required": ["recruiterRelatednessScore", "reasoning", "relatedEvidence", "concerns"],
    }


def _recommendation_schema() -> dict[str, Any]:
    return {
        "type": "OBJECT",
        "properties": {
            "personalizedSummary": {"type": "STRING"},
            "matchExplanation": {"type": "STRING"},
            "improvementTips": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
            },
            "resumeKeywords": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
            },
            "suggestedExperience": {
                "type": "ARRAY",
                "items": {"type": "STRING"},
            },
            "resumeBulletChanges": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "current": {"type": "STRING"},
                        "suggestion": {"type": "STRING"},
                        "reason": {"type": "STRING"},
                    },
                    "required": ["current", "suggestion", "reason"],
                },
            },
        },
        "required": [
            "personalizedSummary",
            "matchExplanation",
            "improvementTips",
            "resumeKeywords",
            "suggestedExperience",
            "resumeBulletChanges",
        ],
    }


def _gemini_timeout(default: int = 8) -> int:
    try:
        return max(3, int(os.getenv("GEMINI_TIMEOUT_SECONDS", str(default)) or default))
    except ValueError:
        return default


def _gemini_max_tokens(default: int = 4096) -> int:
    try:
        return max(256, int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS", str(default)) or default))
    except ValueError:
        return default


def _gemini_workers(default: int = 5) -> int:
    try:
        return max(1, min(8, int(os.getenv("GEMINI_MAX_WORKERS", str(default)) or default)))
    except ValueError:
        return default


def _generate_json(prompt: str, schema: dict[str, Any], timeout: int | None = None) -> dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return {}

    model = os.getenv("GEMINI_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL
    response = requests.post(
        GEMINI_ENDPOINT.format(model=model),
        params={"key": api_key},
        json={
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": _gemini_max_tokens(),
                "responseMimeType": "application/json",
                "thinkingConfig": {"thinkingBudget": 0},
                "responseSchema": schema,
            },
        },
        timeout=timeout or _gemini_timeout(),
    )
    response.raise_for_status()
    data = response.json()
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    return _safe_json_loads(text)


def get_gemini_recommendations(row: pd.Series, resume_text: str, timeout: int | None = None) -> dict[str, Any]:
    if not os.getenv("GEMINI_API_KEY", "").strip():
        return {}
    payload = _generate_json(_build_prompt(row, resume_text), _recommendation_schema(), timeout=timeout)
    return _sanitize_recommendations(payload)



def _build_recruiter_relatedness_prompt(row: pd.Series, resume_text: str) -> str:
    job = {
        "company": str(row.get("company", "")),
        "title": str(row.get("role", "")),
        "location": str(row.get("location", "")),
        "category": str(row.get("category", "")),
        "source": str(row.get("source", "")),
        "posted": str(row.get("age", "")),
        "deterministicMatchScore": float(row.get("match_score", 0) or 0),
        "matchedSkills": _as_list(row.get("matched_skills", ""), 12),
        "missingSkills": _as_list(row.get("missing_skills", ""), 12),
        "scoreBreakdown": str(row.get("score_breakdown", "")),
    }
    return f"""
You are acting as an experienced university recruiter reviewing an early-career candidate's resume against one job.

Task:
Score recruiter-style relatedness from 0 to 100. This is NOT exact keyword matching. Judge whether a recruiter would reasonably connect the candidate's projects, tools, domain exposure, and role interests to this job.

Rules:
- Do not invent experience or assume skills not shown in the resume/job data.
- Reward adjacent evidence: related projects, transferable tools, relevant domain context, and plausible intern-level fit.
- Penalize major gaps: unrelated domain, senior scope, missing core required stack, hardware/lab mismatch, or location mismatch if meaningful.
- Keep reasoning concise and specific.
- Return only valid JSON.

Resume excerpt:
{_resume_excerpt(resume_text)}

Job match data:
{json.dumps(job, ensure_ascii=True)}

Return JSON:
{{
  "recruiterRelatednessScore": 0,
  "reasoning": "why a recruiter would or would not connect this resume to this job",
  "relatedEvidence": ["resume evidence connected to the role"],
  "concerns": ["gap or risk"]
}}
""".strip()


def _sanitize_agent_score(payload: dict[str, Any]) -> dict[str, Any]:
    try:
        score = float(payload.get("recruiterRelatednessScore", 0))
    except (TypeError, ValueError):
        score = 0.0
    return {
        "recruiterRelatednessScore": round(max(0.0, min(100.0, score)), 1),
        "recruiterRelatednessReasoning": str(payload.get("reasoning", "")).strip(),
        "recruiterRelatedEvidence": _as_list(payload.get("relatedEvidence"), 6),
        "recruiterRelatedConcerns": _as_list(payload.get("concerns"), 6),
    }


def get_recruiter_relatedness(row: pd.Series, resume_text: str, timeout: int | None = None) -> dict[str, Any]:
    if not os.getenv("GEMINI_API_KEY", "").strip():
        return {}
    payload = _generate_json(_build_recruiter_relatedness_prompt(row, resume_text), _score_schema(), timeout=timeout)
    return _sanitize_agent_score(payload)


def _final_score(base_score: float, agent_score: float, ai_weight: float) -> float:
    return round(((1.0 - ai_weight) * float(base_score)) + (ai_weight * float(agent_score)), 1)


def rerank_top_matches_with_recruiter_agent(
    ranked: pd.DataFrame,
    resume_text: str,
    target_size: int = 5,
    batch_size: int = 5,
    max_candidates: int = 5,
    ai_weight: float = 0.20,
) -> pd.DataFrame:
    if not gemini_enabled() or ranked.empty or target_size <= 0:
        return ranked

    ai_weight = max(0.0, min(0.5, float(ai_weight)))
    target_size = min(target_size, len(ranked))
    max_candidates = max(target_size, min(max_candidates, len(ranked)))
    batch_size = max(1, batch_size)
    reranked = ranked.copy().reset_index(drop=True)
    reranked["match_score"] = reranked["match_score"].astype(float)
    reranked["deterministic_match_score"] = reranked["match_score"]
    reviewed: set[int] = set()

    def review_until(count: int) -> None:
        indices: list[int] = []
        for idx in range(min(count, len(reranked))):
            if idx in reviewed:
                continue
            reviewed.add(idx)
            indices.append(idx)

        if not indices:
            return

        max_workers = min(_gemini_workers(), len(indices))
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {
                executor.submit(get_recruiter_relatedness, reranked.loc[idx].copy(), resume_text): idx
                for idx in indices
            }
            for future in as_completed(futures):
                idx = futures[future]
                try:
                    result = future.result()
                except Exception as exc:
                    reranked.at[idx, "ai_recruiter_error"] = str(exc)
                    continue
                if not result:
                    continue
                row = reranked.loc[idx]
                agent_score = float(result["recruiterRelatednessScore"])
                base_score = float(row.get("deterministic_match_score", row.get("match_score", 0)) or 0)
                reranked.at[idx, "ai_recruiter_relatedness_score"] = agent_score
                reranked.at[idx, "ai_recruiter_reasoning"] = result["recruiterRelatednessReasoning"]
                reranked.at[idx, "ai_recruiter_evidence"] = json.dumps(result["recruiterRelatedEvidence"])
                reranked.at[idx, "ai_recruiter_concerns"] = json.dumps(result["recruiterRelatedConcerns"])
                reranked.at[idx, "ai_recruiter_provider"] = "Gemini"
                reranked.at[idx, "match_score"] = _final_score(base_score, agent_score, ai_weight)

    reviewed_count = 0
    while True:
        reviewed_count = min(max_candidates, max(target_size, reviewed_count + batch_size))
        review_until(reviewed_count)
        reviewed_frame = reranked.loc[sorted(reviewed)].copy()
        if len(reviewed_frame) < target_size:
            if reviewed_count >= max_candidates:
                break
            continue
        cutoff = float(reviewed_frame.sort_values("match_score", ascending=False).iloc[target_size - 1]["match_score"])
        next_idx = reviewed_count
        if next_idx >= max_candidates or next_idx >= len(reranked):
            break
        next_base = float(reranked.loc[next_idx].get("deterministic_match_score", reranked.loc[next_idx].get("match_score", 0)) or 0)
        next_best_case = _final_score(next_base, 100.0, ai_weight)
        if next_best_case <= cutoff:
            break

    reranked["recommendation"] = reranked["match_score"].apply(lambda score: "Apply" if score >= 78 else "Maybe apply" if score >= 58 else "Skip")
    return reranked.sort_values("match_score", ascending=False).reset_index(drop=True)


def enrich_ranked_with_gemini(ranked: pd.DataFrame, resume_text: str, limit: int = 2) -> pd.DataFrame:
    if not gemini_enabled() or ranked.empty or limit <= 0:
        return ranked

    enriched = ranked.copy()
    indices = list(enriched.head(limit).index)
    if not indices:
        return enriched

    max_workers = min(_gemini_workers(default=2), len(indices))
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(get_gemini_recommendations, enriched.loc[index].copy(), resume_text): index
            for index in indices
        }
        for future in as_completed(futures):
            index = futures[future]
            try:
                recommendations = future.result()
            except Exception as exc:
                enriched.at[index, "ai_recommendation_error"] = str(exc)
                continue

            if not recommendations:
                continue
            enriched.at[index, "ai_recommendations"] = json.dumps(recommendations)
            enriched.at[index, "ai_recommendations_provider"] = "Gemini"
            if recommendations.get("personalizedSummary"):
                enriched.at[index, "match_explanation"] = recommendations["personalizedSummary"]
            if recommendations.get("improvementTips"):
                enriched.at[index, "tailoring_tips"] = ". ".join(recommendations["improvementTips"])

    return enriched
