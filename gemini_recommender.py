from __future__ import annotations

import json
import os
import re
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


def get_gemini_recommendations(row: pd.Series, resume_text: str, timeout: int = 20) -> dict[str, Any]:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return {}

    model = os.getenv("GEMINI_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL
    url = GEMINI_ENDPOINT.format(model=model)
    payload = {
        "contents": [{"parts": [{"text": _build_prompt(row, resume_text)}]}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 4096,
            "responseMimeType": "application/json",
            "thinkingConfig": {"thinkingBudget": 0},
            "responseSchema": {
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
            },
        },
    }
    response = requests.post(
        url,
        params={"key": api_key},
        json=payload,
        timeout=timeout,
    )
    response.raise_for_status()
    data = response.json()
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    return _sanitize_recommendations(_safe_json_loads(text))


def enrich_ranked_with_gemini(ranked: pd.DataFrame, resume_text: str, limit: int = 5) -> pd.DataFrame:
    if not gemini_enabled() or ranked.empty or limit <= 0:
        return ranked

    enriched = ranked.copy()
    for index, row in enriched.head(limit).iterrows():
        try:
            recommendations = get_gemini_recommendations(row, resume_text)
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
