from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd


DEFAULT_US_JOB_FINDER_PATH = Path("/private/tmp/us_job_finder.py")


def _age_from_date(date_value: str) -> str:
    if not date_value:
        return ""
    value = str(date_value).strip().replace("Z", "+00:00")
    try:
        posted = datetime.fromisoformat(value)
    except ValueError:
        return str(date_value)
    if posted.tzinfo is None:
        posted = posted.replace(tzinfo=timezone.utc)
    days = max(0, (datetime.now(timezone.utc) - posted).days)
    return f"{days}d"


def run_us_job_finder(
    query: str,
    limit: int = 50,
    location: str = "United States",
    tool_path: Path = DEFAULT_US_JOB_FINDER_PATH,
) -> pd.DataFrame:
    if not tool_path.exists():
        raise FileNotFoundError(f"US Job Finder tool not found at {tool_path}")

    command = [
        sys.executable,
        str(tool_path),
        "--query",
        query,
        "--location",
        location,
        "--limit",
        str(limit),
        "--format",
        "json",
    ]
    result = subprocess.run(command, capture_output=True, text=True, timeout=60, check=True)
    payload = json.loads(result.stdout or "[]")

    rows = []
    for item in payload:
        title = str(item.get("title", ""))
        source = str(item.get("source", "us_job_finder"))
        rows.append(
            {
                "company": str(item.get("company", "")),
                "role": title,
                "location": str(item.get("location", "")),
                "application_link": str(item.get("url", "")),
                "age": _age_from_date(str(item.get("date_posted", ""))),
                "category": f"US Job Finder - {source}",
                "description": str(item.get("description", "")),
                "salary": str(item.get("salary", "")),
                "source": source,
            }
        )

    frame = pd.DataFrame(rows)
    if frame.empty:
        return pd.DataFrame(
            columns=[
                "company",
                "role",
                "location",
                "application_link",
                "age",
                "category",
                "description",
                "salary",
                "source",
            ]
        )
    return frame.drop_duplicates(subset=["company", "role", "location", "application_link"]).reset_index(drop=True)
