from __future__ import annotations

import re

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from skills import extract_skills, format_skills, normalize_text


ROLE_KEYWORDS = {
    "data": {"data analyst", "data analytics", "business intelligence", "bi", "analytics"},
    "data science": {"data science", "data scientist", "machine learning", "ml", "ai"},
    "data engineering": {"data engineer", "data engineering", "etl", "pipeline", "database"},
    "ai/ml": {"ai", "ml", "machine learning", "generative ai", "llm", "rag"},
    "software": {"software", "backend", "frontend", "full stack", "api"},
}


def _age_to_days(age: str) -> int:
    text = normalize_text(age)
    match = re.search(r"(\d+)\s*d", text)
    if match:
        return int(match.group(1))
    match = re.search(r"(\d+)\s*mo", text)
    if match:
        return int(match.group(1)) * 30
    return 45


def freshness_score(age: str) -> float:
    days = _age_to_days(age)
    if days <= 3:
        return 1.0
    if days <= 10:
        return 0.8
    if days <= 30:
        return 0.55
    if days <= 60:
        return 0.35
    return 0.2


def title_match_score(role: str, preferred_role_types: list[str] | None = None) -> float:
    role_text = normalize_text(role)
    if not preferred_role_types:
        preferred_role_types = ["data", "data science", "data engineering", "ai/ml"]
    hits = 0
    for role_type in preferred_role_types:
        keywords = ROLE_KEYWORDS.get(role_type.lower(), {role_type.lower()})
        if any(keyword in role_text for keyword in keywords):
            hits += 1
    return min(1.0, hits / max(1, min(2, len(preferred_role_types))))


def location_score(location: str, preferred_locations: list[str] | None = None) -> float:
    if not preferred_locations:
        preferred_locations = ["remote", "new york", "nyc", "new jersey", "nj", "philadelphia", "pa"]
    text = normalize_text(location)
    if any(pref.lower() in text for pref in preferred_locations):
        return 1.0
    if "united states" in text or "usa" in text:
        return 0.7
    return 0.45


def recommendation(score: float) -> str:
    if score >= 78:
        return "Apply"
    if score >= 58:
        return "Maybe apply"
    return "Skip"


def _safe_job_text(row: pd.Series) -> str:
    return " ".join(str(row.get(col, "")) for col in ["company", "role", "location", "category", "description", "salary", "source"])


def rank_jobs(
    resume_text: str,
    jobs: pd.DataFrame,
    preferred_role_types: list[str] | None = None,
    preferred_locations: list[str] | None = None,
) -> pd.DataFrame:
    if jobs.empty:
        return jobs.copy()

    resume_skills = extract_skills(resume_text)
    job_texts = jobs.apply(_safe_job_text, axis=1).tolist()
    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), min_df=1)
    matrix = vectorizer.fit_transform([resume_text] + job_texts)
    similarities = cosine_similarity(matrix[0:1], matrix[1:]).flatten()

    ranked = jobs.copy()
    rows = []
    for idx, row in ranked.iterrows():
        job_text = _safe_job_text(row)
        job_skills = extract_skills(job_text)
        matched = resume_skills & job_skills
        missing = job_skills - resume_skills
        skill_overlap = len(matched) / max(1, len(job_skills))
        title_score = title_match_score(str(row.get("role", "")), preferred_role_types)
        loc_score = location_score(str(row.get("location", "")), preferred_locations)
        fresh_score = freshness_score(str(row.get("age", "")))

        score = (
            0.35 * float(similarities[idx])
            + 0.30 * skill_overlap
            + 0.20 * title_score
            + 0.10 * loc_score
            + 0.05 * fresh_score
        ) * 100

        explanation = build_match_explanation(row, matched, missing, title_score, loc_score, fresh_score)
        rows.append(
            {
                "match_score": round(score, 1),
                "matched_skills": format_skills(matched),
                "missing_skills": format_skills(missing),
                "recommendation": recommendation(score),
                "match_explanation": explanation,
                "tailoring_tips": build_tailoring_tips(row, matched, missing),
            }
        )

    additions = pd.DataFrame(rows)
    ranked = pd.concat([ranked.reset_index(drop=True), additions], axis=1)
    return ranked.sort_values("match_score", ascending=False).reset_index(drop=True)


def build_match_explanation(row: pd.Series, matched: set[str], missing: set[str], title_score: float, loc_score: float, fresh_score: float) -> str:
    reasons = []
    if matched:
        reasons.append(f"Matches your {format_skills(set(list(matched)[:6]))} background")
    if title_score >= 0.5:
        reasons.append("role title lines up with your target roles")
    if loc_score >= 0.9:
        reasons.append("location matches your preferred geography")
    if fresh_score >= 0.8:
        reasons.append("posting is fresh")
    if missing:
        reasons.append(f"watch gaps around {format_skills(set(list(missing)[:4]))}")
    return "; ".join(reasons) + "."


def build_tailoring_tips(row: pd.Series, matched: set[str], missing: set[str]) -> str:
    role = str(row.get("role", "this role"))
    tips = [
        f"Lead with the project closest to {role}.",
        "Use the same keywords as the posting in your bullets.",
    ]
    if matched:
        tips.append(f"Make {format_skills(set(list(matched)[:4]))} easy to spot.")
    if missing:
        tips.append(f"Add a small project or coursework note for {format_skills(set(list(missing)[:3]))} if truthful.")
    return " ".join(tips)


def missing_skills_summary(ranked_jobs: pd.DataFrame, top_n: int = 25) -> pd.DataFrame:
    counts: dict[str, int] = {}
    for skills in ranked_jobs.head(top_n).get("missing_skills", []):
        for skill in str(skills).split(","):
            skill = skill.strip()
            if skill:
                counts[skill] = counts.get(skill, 0) + 1
    return pd.DataFrame(
        [{"skill": skill, "count": count} for skill, count in sorted(counts.items(), key=lambda item: item[1], reverse=True)]
    )
