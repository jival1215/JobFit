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
JOBRIGHT_DATA_NEW_GRAD_URL = "https://raw.githubusercontent.com/jobright-ai/2026-Data-Analysis-New-Grad/master/README.md"
JOBRIGHT_SOFTWARE_NEW_GRAD_URL = "https://raw.githubusercontent.com/jobright-ai/2026-Software-Engineer-New-Grad/master/README.md"
JOBRIGHT_PRODUCT_INTERNSHIP_URL = "https://raw.githubusercontent.com/jobright-ai/2026-Product-Management-Internship/master/README.md"
JOBRIGHT_SOFTWARE_INTERNSHIP_URL = "https://raw.githubusercontent.com/jobright-ai/2026-Software-Engineer-Internship/master/README.md"
JOBRIGHT_PUBLIC_SECTOR_INTERNSHIP_URL = "https://raw.githubusercontent.com/jobright-ai/2026-Public-Sector-Internship/master/README.md"

ALL_JOB_REPOS_SOURCE = "All job repos"

JOB_SOURCES = {
    "Summer internships": DEFAULT_SIMPLIFY_URL,
    "Fall internships": OFF_SEASON_SIMPLIFY_URL,
    "Full time": NEW_GRAD_SIMPLIFY_URL,
    "Jobright data new grad": JOBRIGHT_DATA_NEW_GRAD_URL,
    "Jobright software new grad": JOBRIGHT_SOFTWARE_NEW_GRAD_URL,
    "Jobright product internships": JOBRIGHT_PRODUCT_INTERNSHIP_URL,
    "Jobright software internships": JOBRIGHT_SOFTWARE_INTERNSHIP_URL,
    "Jobright public sector internships": JOBRIGHT_PUBLIC_SECTOR_INTERNSHIP_URL,
}

JOB_SOURCE_LABELS = [ALL_JOB_REPOS_SOURCE, *JOB_SOURCES.keys()]


@dataclass
class JobPosting:
    company: str
    role: str
    location: str
    application_link: str
    age: str
    category: str


def fetch_markdown(url: str = DEFAULT_SIMPLIFY_URL, timeout: int = 20) -> str:
    response = requests.get(
        url,
        timeout=timeout,
        headers={
            "Cache-Control": "no-cache",
            "Pragma": "no-cache",
            "User-Agent": "JobFIT/0.1 (+https://github.com/jival1215/JobFit)",
        },
        params={"jobfit_refresh": pd.Timestamp.utcnow().strftime("%Y%m%d%H%M%S")},
    )
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
    links = [html.unescape(a.get("href", "").strip()) for a in soup.find_all("a") if a.get("href", "").strip()]
    if not links:
        return ""

    direct_apply_links = [link for link in links if "simplify.jobs/p/" not in link]
    return direct_apply_links[0] if direct_apply_links else links[0]


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


def _markdown_link_text(value: str) -> str:
    match = re.search(r"\[([^\]]+)\]\(([^)]+)\)", value)
    if match:
        return _clean_cell(match.group(1).strip(" *"))
    return _clean_cell(value.strip(" *"))


def _markdown_link_url(value: str) -> str:
    links = re.findall(r"\[[^\]]+\]\(([^)]+)\)", value)
    return html.unescape(links[-1].strip()) if links else ""


def _split_markdown_table_rows(markdown: str) -> list[list[str]]:
    rows: list[list[str]] = []
    lines = [line.strip() for line in markdown.replace("\r", "\n").splitlines() if line.strip()]

    for line in lines:
        if not line.startswith("|") or line.count("|") < 5:
            continue
        cells = [cell.strip() for cell in line.strip("|").split("|")]
        if len(cells) > 5 and "" in cells:
            segment: list[str] = []
            for cell in cells:
                if cell == "":
                    if len(segment) >= 5:
                        rows.append(segment[:5])
                    segment = []
                else:
                    segment.append(cell)
            if len(segment) >= 5:
                rows.append(segment[:5])
        elif len(cells) >= 5:
            rows.append(cells[:5])

    if rows:
        return rows

    compact = re.sub(r"\s+", " ", markdown).strip()
    pattern = re.compile(r"\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|")
    for match in pattern.finditer(compact):
        cells = [match.group(index).strip() for index in range(1, 6)]
        if len(cells) >= 5:
            rows.append(cells)
    return rows


def parse_jobright_jobs(markdown: str, category: str = "Jobright") -> pd.DataFrame:
    postings: list[JobPosting] = []
    last_company = ""
    for cells in _split_markdown_table_rows(markdown):
        lowered = [cell.lower().strip() for cell in cells]
        if lowered[:2] == ["company", "job title"] or all(set(cell) <= {"-", ":"} for cell in lowered[:2]):
            continue
        if len(cells) < 5:
            continue

        company = _markdown_link_text(cells[0])
        if company == "↳":
            company = last_company
        elif company:
            last_company = company
        role = _markdown_link_text(cells[1])
        location = _clean_cell(cells[2])
        work_model = _clean_cell(cells[3])
        age = _clean_cell(cells[4])
        application_link = _markdown_link_url(cells[1]) or _markdown_link_url(cells[0])
        if work_model and work_model.lower() not in location.lower():
            location = f"{location} ({work_model})" if location else work_model
        if company and role:
            postings.append(JobPosting(company, role, location, application_link, age, category))

    frame = pd.DataFrame([posting.__dict__ for posting in postings])
    if frame.empty:
        return pd.DataFrame(columns=["company", "role", "location", "application_link", "age", "category"])
    return frame.drop_duplicates(subset=["company", "role", "location", "application_link"]).reset_index(drop=True)


def parse_job_postings(markdown: str, source_name: str = "") -> pd.DataFrame:
    simplify = parse_simplify_jobs(markdown)
    if not simplify.empty:
        return simplify
    return parse_jobright_jobs(markdown, source_name or "Jobright")
