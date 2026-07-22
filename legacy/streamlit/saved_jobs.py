from __future__ import annotations

from datetime import date, timedelta
from pathlib import Path

import pandas as pd


DEFAULT_STATUS_FILE = Path("saved_jobs.csv")
STATUSES = ["Saved", "Applied", "Skipped"]
STATUS_COLUMNS = [
    "job_id",
    "company",
    "role",
    "location",
    "application_link",
    "status",
    "notes",
    "applied_date",
    "follow_up_date",
]


def load_statuses(path: Path = DEFAULT_STATUS_FILE) -> pd.DataFrame:
    if not path.exists():
        return pd.DataFrame(columns=STATUS_COLUMNS)
    frame = pd.read_csv(path)
    for column in STATUS_COLUMNS:
        if column not in frame.columns:
            frame[column] = ""
    return frame[STATUS_COLUMNS]


def make_job_id(company: str, role: str, location: str, application_link: str) -> str:
    return "|".join([company.strip().lower(), role.strip().lower(), location.strip().lower(), application_link.strip().lower()])


def save_job_status(
    job: dict,
    status: str,
    notes: str = "",
    applied_date: str = "",
    follow_up_date: str = "",
    path: Path = DEFAULT_STATUS_FILE,
) -> None:
    if status not in STATUSES:
        raise ValueError(f"Status must be one of {STATUSES}")
    current = load_statuses(path)
    job_id = make_job_id(job.get("company", ""), job.get("role", ""), job.get("location", ""), job.get("application_link", ""))
    existing = current[current["job_id"] == job_id].iloc[0].to_dict() if not current.empty and job_id in set(current["job_id"]) else {}

    if status == "Applied" and not applied_date:
        applied_date = str(date.today())
    if status == "Applied" and not follow_up_date:
        follow_up_date = str(date.today() + timedelta(days=7))

    row = {
        "job_id": job_id,
        "company": job.get("company", ""),
        "role": job.get("role", ""),
        "location": job.get("location", ""),
        "application_link": job.get("application_link", ""),
        "status": status,
        "notes": notes if notes is not None else existing.get("notes", ""),
        "applied_date": applied_date if applied_date is not None else existing.get("applied_date", ""),
        "follow_up_date": follow_up_date if follow_up_date is not None else existing.get("follow_up_date", ""),
    }
    current = current[current["job_id"] != job_id] if not current.empty else current
    current = pd.concat([current, pd.DataFrame([row])], ignore_index=True)
    current.to_csv(path, index=False)


def merge_statuses(jobs: pd.DataFrame, statuses: pd.DataFrame) -> pd.DataFrame:
    jobs = jobs.copy()
    jobs["job_id"] = jobs.apply(
        lambda row: make_job_id(str(row["company"]), str(row["role"]), str(row["location"]), str(row["application_link"])),
        axis=1,
    )
    if statuses.empty:
        for column in ["status", "notes", "applied_date", "follow_up_date"]:
            jobs[column] = ""
        return jobs
    return jobs.merge(
        statuses[["job_id", "status", "notes", "applied_date", "follow_up_date"]],
        on="job_id",
        how="left",
    ).fillna({"status": "", "notes": "", "applied_date": "", "follow_up_date": ""})


def tracker_summary(statuses: pd.DataFrame) -> dict[str, int]:
    if statuses.empty:
        return {"Saved": 0, "Applied": 0, "Skipped": 0, "Needs follow-up": 0}
    today = pd.Timestamp(date.today())
    followups = pd.to_datetime(statuses.get("follow_up_date", ""), errors="coerce")
    needs_followup = int(((statuses["status"] == "Applied") & followups.notna() & (followups <= today)).sum())
    return {
        "Saved": int((statuses["status"] == "Saved").sum()),
        "Applied": int((statuses["status"] == "Applied").sum()),
        "Skipped": int((statuses["status"] == "Skipped").sum()),
        "Needs follow-up": needs_followup,
    }
