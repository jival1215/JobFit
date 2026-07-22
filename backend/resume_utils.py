from __future__ import annotations

import os
import re
from io import BytesIO
from pathlib import Path
from typing import Any

from docx import Document
from PyPDF2 import PdfReader

ALLOWED_RESUME_SUFFIXES = {".pdf", ".docx", ".txt"}
DEFAULT_MAX_RESUME_BYTES = 5 * 1024 * 1024
SECTION_HEADERS = {"education", "experience", "projects", "skills", "technical skills", "coursework"}


def max_resume_bytes() -> int:
    try:
        value = int(os.getenv("JOBFIT_MAX_RESUME_BYTES", str(DEFAULT_MAX_RESUME_BYTES)) or DEFAULT_MAX_RESUME_BYTES)
    except ValueError:
        value = DEFAULT_MAX_RESUME_BYTES
    return max(256 * 1024, min(25 * 1024 * 1024, value))


def validate_resume_upload(filename: str, data: bytes) -> None:
    suffix = Path(filename or "").suffix.lower()
    if suffix not in ALLOWED_RESUME_SUFFIXES:
        allowed = ", ".join(sorted(ALLOWED_RESUME_SUFFIXES))
        raise ValueError(f"Unsupported resume type. Upload one of: {allowed}.")
    if not data:
        raise ValueError("Resume file is empty.")
    limit = max_resume_bytes()
    if len(data) > limit:
        limit_mb = round(limit / (1024 * 1024), 1)
        raise OverflowError(f"Resume file is too large. Maximum size is {limit_mb}MB.")


def normalize_resume_text(text: str) -> str:
    lines = [re.sub(r"\s+", " ", line).strip() for line in text.replace("\x00", "").splitlines()]
    cleaned = [line for line in lines if line]
    return "\n".join(cleaned).strip()


def extract_text_from_pdf(file_obj) -> str:
    reader = PdfReader(file_obj)
    parts = []
    for page in reader.pages:
        parts.append(page.extract_text() or "")
    return normalize_resume_text("\n".join(parts))


def extract_text_from_docx(file_obj) -> str:
    document = Document(file_obj)
    return normalize_resume_text("\n".join(p.text for p in document.paragraphs))


def extract_text_from_txt(file_obj) -> str:
    data = file_obj.read()
    if isinstance(data, str):
        return normalize_resume_text(data)
    return normalize_resume_text(data.decode("utf-8", errors="ignore"))


def extract_resume_text(uploaded_file) -> str:
    name = getattr(uploaded_file, "name", "")
    suffix = Path(name).suffix.lower()
    data = uploaded_file.read()
    validate_resume_upload(name, data)
    buffer = BytesIO(data)

    if suffix == ".pdf":
        return extract_text_from_pdf(buffer)
    if suffix == ".docx":
        return extract_text_from_docx(buffer)
    if suffix == ".txt":
        return extract_text_from_txt(BytesIO(data))
    raise ValueError("Unsupported resume type. Upload a PDF, DOCX, or TXT file.")


def _candidate_bullets(text: str) -> list[str]:
    bullets: list[str] = []
    for raw in text.splitlines():
        line = raw.strip(" -•*\t")
        if len(line) < 25 or len(line) > 280:
            continue
        if line.lower().strip(":") in SECTION_HEADERS:
            continue
        if re.search(r"@|linkedin|github", line, flags=re.I):
            continue
        if line.lower() not in {item.lower() for item in bullets}:
            bullets.append(line)
    return bullets[:40]


def _section_lines(text: str, section_names: set[str]) -> list[str]:
    active = False
    lines: list[str] = []
    for raw in text.splitlines():
        line = raw.strip()
        header = line.lower().strip(":")
        if header in SECTION_HEADERS:
            active = header in section_names
            continue
        if active and line:
            lines.append(line)
    return lines[:30]


def parse_resume_structure(text: str) -> dict[str, Any]:
    normalized = normalize_resume_text(text)
    bullets = _candidate_bullets(normalized)
    skills_lines = _section_lines(normalized, {"skills", "technical skills"})
    project_lines = _section_lines(normalized, {"projects"})
    education_lines = _section_lines(normalized, {"education"})

    keyword_candidates = re.findall(r"[A-Za-z][A-Za-z0-9+#.:-]{1,}", normalized)
    stopwords = {"and", "the", "with", "for", "from", "that", "this", "using", "built", "created", "developed"}
    keywords: list[str] = []
    for word in keyword_candidates:
        cleaned = word.strip(".,:;()[]{}").lower()
        if len(cleaned) < 3 or cleaned in stopwords:
            continue
        if cleaned not in {item.lower() for item in keywords}:
            keywords.append(cleaned)
        if len(keywords) >= 40:
            break

    return {
        "skills": skills_lines,
        "projects": project_lines,
        "education": education_lines,
        "experienceBullets": bullets,
        "keywords": keywords,
    }
