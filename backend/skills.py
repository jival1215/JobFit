import re


SKILL_ALIASES = {
    "sklearn": "scikit-learn",
    "scikit learn": "scikit-learn",
    "js": "javascript",
    "postgres": "postgresql",
    "postgresql": "postgresql",
    "gen ai": "generative ai",
    "genai": "generative ai",
    "ml": "machine learning",
    "rag": "rag",
}


BASE_SKILLS = {
    "python",
    "sql",
    "java",
    "javascript",
    "typescript",
    "c",
    "c++",
    "pandas",
    "numpy",
    "scikit-learn",
    "machine learning",
    "generative ai",
    "rag",
    "llm",
    "ocr",
    "llamaindex",
    "postgresql",
    "mysql",
    "power bi",
    "tableau",
    "excel",
    "dashboard",
    "dashboards",
    "data analytics",
    "data analysis",
    "data engineering",
    "etl",
    "aws",
    "docker",
    "fastapi",
    "react",
    "streamlit",
    "snowflake",
    "databricks",
    "spark",
    "pyspark",
    "statistics",
    "forecasting",
    "nlp",
    "api",
    "apis",
    "git",
    "linux",
}


def normalize_text(text: str) -> str:
    text = (text or "").lower()
    text = text.replace("&amp;", "&")
    text = re.sub(r"[^a-z0-9+#./ -]+", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def normalize_skill(skill: str) -> str:
    cleaned = normalize_text(skill).replace("-", " ")
    cleaned = SKILL_ALIASES.get(cleaned, cleaned)
    return cleaned


def extract_skills(text: str, extra_skills: set[str] | None = None) -> set[str]:
    normalized = normalize_text(text)
    skills = set()
    vocabulary = {normalize_skill(skill) for skill in BASE_SKILLS}
    if extra_skills:
        vocabulary |= {normalize_skill(skill) for skill in extra_skills}

    search_terms = {skill: skill for skill in vocabulary}
    for alias, canonical in SKILL_ALIASES.items():
        search_terms[normalize_text(alias)] = canonical

    for term, canonical in sorted(search_terms.items(), key=lambda item: len(item[0]), reverse=True):
        pattern = r"(?<![a-z0-9+#])" + re.escape(term).replace(r"\ ", r"\s+") + r"(?![a-z0-9+#])"
        if re.search(pattern, normalized):
            skills.add(normalize_skill(canonical))

    if "dashboards" in skills:
        skills.add("dashboard")
    if "apis" in skills:
        skills.add("api")
    return skills


def format_skills(skills: set[str]) -> str:
    return ", ".join(sorted(skills))
