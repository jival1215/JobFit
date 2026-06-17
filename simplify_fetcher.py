from __future__ import annotations

import html
import re
from dataclasses import dataclass

import pandas as pd
import requests
from bs4 import BeautifulSoup


DEFAULT_SIMPLIFY_URL = "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md"
OFF_SEASON_SIMPLIFY_URL = "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README-Off-Season.md"
NEW_GRAD_SIMPLIFY_URL = "https://raw.githubusercontent.com/SimplifyJobs/New-Grad-Positions/dev/README.md"

JOB_SOURCES = {
    "Summer internships": DEFAULT_SIMPLIFY_URL,
    "Fall internships": OFF_SEASON_SIMPLIFY_URL,
    "Full time": NEW_GRAD_SIMPLIFY_URL,
}


@dataclass
class JobPosting:
    company: str
    role: str
    location: str
    application_link: str
    age: str
    category: str


def fetch_markdown(url: str = DEFAULT_SIMPLIFY_URL, timeout: int = 20) -> str:
    response = requests.get(url, timeout=timeout)
    response.raise_for_status()
    return response.text


def _clean_cell(value: str) -> str:
    value = re.sub(r"<details>.*?<summary><strong>(.*?)</strong></summary>.*?</details>", r"\1", value, flags=re.S)
    value = re.sub(r"<br\s*/?>|</br>", " / ", value, flags=re.I)
    soup = BeautifulSoup(value, "html.parser")
    text = soup.get_text(" ", strip=True)
    text = html.unescape(text)
    text = text.replace("🔥", "").replace("🎓", "").replace("🛂", "").replace("🇺🇸", "")
    return re.sub(r"\s+", " ", text).strip()


def _first_link(value: str) -> str:
    soup = BeautifulSoup(value, "html.parser")
    links = [a.get("href", "") for a in soup.find_all("a")]
    apply_links = [link for link in links if "simplify.jobs/p/" not in link and link]
    return html.unescape(apply_links[0]) if apply_links else ""


def _parse_html_table(table_html: str, category: str) -> list[JobPosting]:
    soup = BeautifulSoup(table_html, "html.parser")
    rows = soup.find_all("tr")
    postings: list[JobPosting] = []
    last_company = ""

    for row in rows:
        cells = row.find_all("td")
        if len(cells) < 4:
            continue

        raw_cells = [str(cell) for cell in cells]
        cleaned = [_clean_cell(cell) for cell in raw_cells]
        if "🔒" in raw_cells[-2:] or any(cell == "🔒" for cell in cleaned):
            continue

        company = cleaned[0]
        if company in {"↳", ""}:
            company = last_company
        else:
            last_company = company

        role = cleaned[1] if len(cleaned) > 1 else ""
        location = cleaned[2] if len(cleaned) > 2 else ""
        application_link = _first_link(raw_cells[-2] if len(raw_cells) >= 5 else raw_cells[3])
        age = cleaned[-1]

        if company and role:
            postings.append(JobPosting(company, role, location, application_link, age, category))
    return postings


def parse_simplify_jobs(markdown: str) -> pd.DataFrame:
    headings = list(re.finditer(r"^##\s+(.+?)\s*$", markdown, flags=re.M))
    postings: list[JobPosting] = []

    for index, heading in enumerate(headings):
        category = _clean_cell(heading.group(1))
        start = heading.end()
        end = headings[index + 1].start() if index + 1 < len(headings) else len(markdown)
        section = markdown[start:end]
        for table_match in re.finditer(r"<table.*?>.*?</table>", section, flags=re.S | re.I):
            postings.extend(_parse_html_table(table_match.group(0), category))

    frame = pd.DataFrame([posting.__dict__ for posting in postings])
    if frame.empty:
        return pd.DataFrame(columns=["company", "role", "location", "application_link", "age", "category"])
    return frame.drop_duplicates(subset=["company", "role", "location", "application_link"]).reset_index(drop=True)
