from __future__ import annotations

from pathlib import Path

import pandas as pd


DEFAULT_STATUS_FILE = Path("saved_jobs.csv")
STATUSES = ["Saved", "Applied", "Skipped"]


def load_statuses(path: Path = DEFAULT_STATUS_FILE) -> pd.DataFrame:
    if not path.exists():
        return pd.DataFrame(columns=["job_id", "company", "role", "location", "application_link", "status"])
    return pd.read_csv(path)


def make_job_id(company: str, role: str, location: str, application_link: str) -> str:
    return "|".join([company.strip().lower(), role.strip().lower(), location.strip().lower(), application_link.strip().lower()])


def save_job_status(job: dict, status: str, path: Path = DEFAULT_STATUS_FILE) -> None:
    if status not in STATUSES:
        raise ValueError(f"Status must be one of {STATUSES}")
    current = load_statuses(path)
    job_id = make_job_id(job.get("company", ""), job.get("role", ""), job.get("location", ""), job.get("application_link", ""))
    row = {
        "job_id": job_id,
        "company": job.get("company", ""),
        "role": job.get("role", ""),
        "location": job.get("location", ""),
        "application_link": job.get("application_link", ""),
        "status": status,
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
        jobs["status"] = ""
        return jobs
    return jobs.merge(statuses[["job_id", "status"]], on="job_id", how="left").fillna({"status": ""})
