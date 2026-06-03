from __future__ import annotations

from io import BytesIO
from pathlib import Path

from docx import Document
from PyPDF2 import PdfReader


def extract_text_from_pdf(file_obj) -> str:
    reader = PdfReader(file_obj)
    parts = []
    for page in reader.pages:
        parts.append(page.extract_text() or "")
    return "\n".join(parts).strip()


def extract_text_from_docx(file_obj) -> str:
    document = Document(file_obj)
    return "\n".join(p.text for p in document.paragraphs).strip()


def extract_text_from_txt(file_obj) -> str:
    data = file_obj.read()
    if isinstance(data, str):
        return data
    return data.decode("utf-8", errors="ignore").strip()


def extract_resume_text(uploaded_file) -> str:
    name = getattr(uploaded_file, "name", "")
    suffix = Path(name).suffix.lower()
    data = uploaded_file.read()
    buffer = BytesIO(data)

    if suffix == ".pdf":
        return extract_text_from_pdf(buffer)
    if suffix == ".docx":
        return extract_text_from_docx(buffer)
    if suffix == ".txt":
        return extract_text_from_txt(BytesIO(data))
    raise ValueError("Unsupported resume type. Upload a PDF, DOCX, or TXT file.")
