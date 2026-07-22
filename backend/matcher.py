from __future__ import annotations

import re

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .skills import extract_skills, format_skills, normalize_text


ROLE_KEYWORDS = {
    "data": {"data analyst", "data analytics", "business intelligence", "bi", "analytics"},
    "data science": {"data science", "data scientist", "machine learning", "ml", "ai"},
    "data engineering": {"data engineer", "data engineering", "etl", "pipeline", "database"},
    "ai/ml": {"ai", "ml", "machine learning", "generative ai", "llm", "rag"},
    "software": {"software", "backend", "frontend", "full stack", "api"},
}

PROJECT_HINTS = {
    "Pfizer AI document intelligence": {"pfizer", "healthcare", "pharma", "clinical", "medical", "document intelligence", "ocr"},
    "Beats by Dre data analytics": {"beats", "analytics", "dashboard", "business intelligence", "bi", "reporting"},
    "RiskLens ML dashboard": {"risklens", "risk", "machine learning", "model", "forecasting", "dashboard"},
    "FlightTracker data project": {"flighttracker", "pipeline", "database", "etl", "sql", "api"},
}

RECRUITER_CONCEPTS = {
    "data analytics": {"data", "analytics", "analysis", "insights", "reporting", "metrics", "dashboard", "tableau", "power bi", "excel", "sql", "python", "pandas"},
    "data science": {"data science", "machine learning", "ml", "model", "statistics", "forecasting", "python", "pandas", "numpy", "scikit-learn", "experimentation"},
    "data engineering": {"data engineering", "pipeline", "etl", "database", "sql", "postgresql", "api", "spark", "databricks", "snowflake", "aws"},
    "ai/ml": {"ai", "machine learning", "ml", "llm", "rag", "generative ai", "nlp", "python", "model", "automation"},
    "business/bi": {"business intelligence", "bi", "stakeholder", "dashboard", "reporting", "kpi", "metrics", "analytics"},
    "software": {"software", "backend", "frontend", "full stack", "api", "python", "java", "javascript", "react", "docker"},
    "healthcare/pharma": {"healthcare", "pharma", "clinical", "medical", "document intelligence", "ocr", "compliance"},
    "finance/risk": {"finance", "financial", "risk", "model", "forecasting", "analytics", "statistics"},
}

ROLE_CONTEXT_KEYWORDS = {
    "analyst": "data analytics sql dashboard reporting metrics excel tableau power bi stakeholder",
    "analytics": "data analytics sql dashboard reporting metrics excel tableau power bi stakeholder",
    "business intelligence": "business intelligence dashboard kpi reporting metrics sql tableau power bi",
    "data scientist": "data science machine learning statistics python pandas numpy scikit-learn model experimentation",
    "data science": "data science machine learning statistics python pandas numpy scikit-learn model experimentation",
    "machine learning": "machine learning ml model python scikit-learn statistics ai experimentation",
    "ai": "ai machine learning generative ai llm rag nlp automation python",
    "data engineer": "data engineering pipeline etl sql database api spark databricks snowflake aws",
    "software": "software api backend frontend python java javascript react docker",
    "new grad": "entry level internship project coursework python sql analytics software",
    "intern": "internship coursework project entry level python sql analytics communication",
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
    if days <= 1:
        return 1.0
    if days <= 3:
        return 0.95
    if days <= 7:
        return 0.85
    if days <= 14:
        return 0.7
    if days <= 30:
        return 0.45
    if days <= 60:
        return 0.2
    return 0.05


def scoring_weights() -> dict[str, float]:
    return {
        "similarity": 0.25,
        "skill_overlap": 0.25,
        "title_match": 0.15,
        "concept_match": 0.10,
        "location": 0.05,
        "freshness": 0.20,
    }


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
        preferred_locations = ["remote", "new york", "nyc", "new jersey", "nj", "philadelphia", "pa", "united states", "usa"]
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


def curve_score(raw_score: float) -> float:
    score = max(0.0, min(100.0, float(raw_score)))
    return round(score + ((100.0 - score) * 0.25), 1)


def _safe_job_text(row: pd.Series) -> str:
    return " ".join(str(row.get(col, "")) for col in ["company", "role", "location", "category", "description", "salary", "source"])


def _expanded_job_text(row: pd.Series) -> str:
    base = _safe_job_text(row)
    normalized = normalize_text(base)
    inferred = []
    for trigger, context in ROLE_CONTEXT_KEYWORDS.items():
        if trigger in normalized:
            inferred.append(context)
    for concept, terms in RECRUITER_CONCEPTS.items():
        if concept in normalized or any(term in normalized for term in terms):
            inferred.append(" ".join(terms))
    return " ".join([base] + inferred)


def recruiter_concept_score(resume_text: str, job_text: str) -> float:
    resume = normalize_text(resume_text)
    job = normalize_text(job_text)
    relevant = []
    for concept, terms in RECRUITER_CONCEPTS.items():
        job_hits = sum(1 for term in terms if term in job or concept in job)
        if job_hits:
            resume_hits = sum(1 for term in terms if term in resume)
            relevant.append(min(1.0, resume_hits / max(2, min(5, len(terms)))))
    if not relevant:
        return 0.35
    return sum(relevant) / len(relevant)


def softened_similarity(raw_similarity: float, concept_score: float, title_score: float) -> float:
    # Short table rows understate fit, so use raw text as a signal, not the whole verdict.
    return min(1.0, 0.20 + (0.45 * raw_similarity) + (0.25 * concept_score) + (0.10 * title_score))


def _component_percent(value: float) -> float:
    return round(max(0.0, min(1.0, float(value))) * 100, 1)


def _best_project_hint(job_text: str) -> str:
    normalized = normalize_text(job_text)
    scores = []
    for project, terms in PROJECT_HINTS.items():
        scores.append((sum(1 for term in terms if term in normalized), project))
    score, project = max(scores, key=lambda item: item[0])
    return project if score else "your strongest Python, SQL, analytics, AI, or ML project"


def rank_jobs(
    resume_text: str,
    jobs: pd.DataFrame,
    preferred_role_types: list[str] | None = None,
    preferred_locations: list[str] | None = None,
) -> pd.DataFrame:
    if jobs.empty:
        return jobs.copy()

    resume_skills = extract_skills(resume_text)
    job_texts = jobs.apply(_expanded_job_text, axis=1).tolist()
    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), min_df=1)
    matrix = vectorizer.fit_transform([resume_text] + job_texts)
    similarities = cosine_similarity(matrix[0:1], matrix[1:]).flatten()

    ranked = jobs.copy()
    rows = []
    for idx, row in ranked.iterrows():
        job_text = _expanded_job_text(row)
        job_skills = extract_skills(job_text)
        matched = resume_skills & job_skills
        missing = job_skills - resume_skills
        skill_overlap = len(matched) / max(1, len(job_skills))
        title_score = title_match_score(str(row.get("role", "")), preferred_role_types)
        loc_score = location_score(str(row.get("location", "")), preferred_locations)
        fresh_score = freshness_score(str(row.get("age", "")))
        raw_similarity = float(similarities[idx])
        concept_score = recruiter_concept_score(resume_text, job_text)
        similarity = softened_similarity(raw_similarity, concept_score, title_score)

        weights = scoring_weights()
        raw_score = (
            weights["similarity"] * similarity
            + weights["skill_overlap"] * skill_overlap
            + weights["title_match"] * title_score
            + weights["concept_match"] * concept_score
            + weights["location"] * loc_score
            + weights["freshness"] * fresh_score
        ) * 100
        score = curve_score(raw_score)

        breakdown = {
            "similarity_score": _component_percent(similarity),
            "skill_overlap_score": _component_percent(skill_overlap),
            "title_match_score": _component_percent(title_score),
            "concept_match_score": _component_percent(concept_score),
            "location_match_score": _component_percent(loc_score),
            "freshness_score": _component_percent(fresh_score),
        }
        rows.append(
            {
                "match_score": score,
                "raw_match_score": round(raw_score, 1),
                **breakdown,
                "score_breakdown": build_score_breakdown(breakdown),
                "matched_skills": format_skills(matched),
                "missing_skills": format_skills(missing),
                "recommendation": recommendation(score),
                "match_explanation": build_match_explanation(row, matched, missing, breakdown),
                "tailoring_tips": build_tailoring_tips(row, matched, missing),
                "apply_plan": build_apply_plan(row, matched, missing, breakdown),
            }
        )

    additions = pd.DataFrame(rows)
    ranked = pd.concat([ranked.reset_index(drop=True), additions], axis=1)
    return ranked.sort_values("match_score", ascending=False).reset_index(drop=True)


def build_score_breakdown(breakdown: dict[str, float]) -> str:
    weights = scoring_weights()
    return (
        f"Recruiter fit {breakdown['similarity_score']}/100 ({int(weights['similarity'] * 100)}% weight); "
        f"skill overlap {breakdown['skill_overlap_score']}/100 ({int(weights['skill_overlap'] * 100)}%); "
        f"title match {breakdown['title_match_score']}/100 ({int(weights['title_match'] * 100)}%); "
        f"concept match {breakdown['concept_match_score']}/100 ({int(weights['concept_match'] * 100)}%); "
        f"location {breakdown['location_match_score']}/100 ({int(weights['location'] * 100)}%); "
        f"freshness {breakdown['freshness_score']}/100 ({int(weights['freshness'] * 100)}%)."
    )


def build_match_explanation(row: pd.Series, matched: set[str], missing: set[str], breakdown: dict[str, float]) -> str:
    reasons = []
    if matched:
        reasons.append(f"Matches your {format_skills(set(sorted(matched)[:6]))} background")
    if breakdown["title_match_score"] >= 50:
        reasons.append("role title lines up with your target roles")
    if breakdown.get("concept_match_score", 0) >= 55:
        reasons.append("resume shows related experience a recruiter would connect to this role")
    if breakdown["location_match_score"] >= 90:
        reasons.append("location matches your preferred geography")
    if breakdown["freshness_score"] >= 80:
        reasons.append("posting is fresh")
    if missing:
        reasons.append(f"watch gaps around {format_skills(set(sorted(missing)[:4]))}")
    if not reasons:
        reasons.append("limited direct overlap, so treat this as a lower-priority application")
    return "; ".join(reasons) + "."


def build_tailoring_tips(row: pd.Series, matched: set[str], missing: set[str]) -> str:
    role = str(row.get("role", "this role"))
    job_text = _safe_job_text(row)
    project_hint = _best_project_hint(job_text)
    keyword_tip = format_skills(set(sorted(matched)[:5])) if matched else "Python, SQL, analytics, dashboards, and ML"
    tips = [
        f"Lead with {project_hint} when tailoring for {role}.",
        f"Mirror these keywords where truthful: {keyword_tip}.",
    ]
    if missing:
        tips.append(f"Close the biggest gap with a brief project, coursework, or tool note around {format_skills(set(sorted(missing)[:3]))}.")
    else:
        tips.append("Your listed skills cover the posting well, so focus on impact metrics and project outcomes.")
    return " ".join(tips)


def build_apply_plan(row: pd.Series, matched: set[str], missing: set[str], breakdown: dict[str, float]) -> str:
    project_hint = _best_project_hint(_safe_job_text(row))
    matched_text = format_skills(set(sorted(matched)[:6])) or "Python, SQL, dashboards, analytics, and ML"
    missing_text = format_skills(set(sorted(missing)[:4])) or "no major extracted skill gaps"
    return "\n".join(
        [
            f"Why you match: {build_match_explanation(row, matched, missing, breakdown)}",
            f"Resume keywords to emphasize: {matched_text}.",
            f"Project to lead with: {project_hint}.",
            f"Skill gaps to address: {missing_text}.",
            "Application tips: quantify one project result; mirror the role title language in your summary; add a short note about why this company/domain fits your experience.",
        ]
    )


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
