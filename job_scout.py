from __future__ import annotations

from datetime import datetime
from pathlib import Path

import pandas as pd

from saved_jobs import make_job_id


DEFAULT_SEEN_FILE = Path("seen_jobs.csv")
SEEN_COLUMNS = ["job_id", "company", "role", "location", "application_link", "source", "first_seen", "last_seen"]


def _job_id(row: pd.Series) -> str:
    return make_job_id(str(row.get("company", "")), str(row.get("role", "")), str(row.get("location", "")), str(row.get("application_link", "")))


def load_seen_jobs(path: Path = DEFAULT_SEEN_FILE) -> pd.DataFrame:
    if not path.exists():
        return pd.DataFrame(columns=SEEN_COLUMNS)
    frame = pd.read_csv(path)
    for column in SEEN_COLUMNS:
        if column not in frame.columns:
            frame[column] = ""
    return frame[SEEN_COLUMNS]


def mark_new_jobs(jobs: pd.DataFrame, source: str, path: Path = DEFAULT_SEEN_FILE) -> pd.DataFrame:
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    seen = load_seen_jobs(path)
    seen_ids = set(seen["job_id"]) if not seen.empty else set()
    marked = jobs.copy()
    marked["job_id"] = marked.apply(_job_id, axis=1)
    marked["is_new"] = ~marked["job_id"].isin(seen_ids)

    rows = []
    existing_first_seen = dict(zip(seen["job_id"], seen["first_seen"])) if not seen.empty else {}
    for _, row in marked.iterrows():
        rows.append(
            {
                "job_id": row["job_id"],
                "company": row.get("company", ""),
                "role": row.get("role", ""),
                "location": row.get("location", ""),
                "application_link": row.get("application_link", ""),
                "source": source,
                "first_seen": existing_first_seen.get(row["job_id"], now),
                "last_seen": now,
            }
        )
    updated = pd.concat([seen[~seen["job_id"].isin(marked["job_id"])] if not seen.empty else seen, pd.DataFrame(rows)], ignore_index=True)
    updated.to_csv(path, index=False)
    return marked
