from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

DB_PATH = Path(os.getenv("JOBFIT_DB_PATH", "jobfit_local.db"))
SESSION_DAYS = int(os.getenv("JOBFIT_SESSION_DAYS", "14") or 14)
STATUSES = {"Saved", "Applied", "Skipped"}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def get_connection(path: Path | None = None) -> sqlite3.Connection:
    conn = sqlite3.connect(path or DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def db_connection(path: Path | None = None):
    conn = get_connection(path)
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def init_db(path: Path | None = None) -> None:
    with db_connection(path) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS match_runs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                source TEXT NOT NULL,
                source_url TEXT,
                fetched_at TEXT,
                job_count INTEGER NOT NULL DEFAULT 0,
                new_count INTEGER NOT NULL DEFAULT 0,
                ai_enabled INTEGER NOT NULL DEFAULT 0,
                jobs_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS saved_matches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                job_id TEXT NOT NULL,
                company TEXT NOT NULL,
                title TEXT NOT NULL,
                location TEXT,
                apply_url TEXT,
                source TEXT,
                posted TEXT,
                match_score REAL,
                status TEXT NOT NULL,
                notes TEXT,
                job_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                UNIQUE(user_id, job_id)
            );
            """
        )


def _hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 180_000)
    return "pbkdf2_sha256$180000$" + base64.b64encode(salt).decode("ascii") + "$" + base64.b64encode(digest).decode("ascii")


def _verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt_b64, digest_b64 = stored_hash.split("$", 3)
    except ValueError:
        return False
    if algorithm != "pbkdf2_sha256":
        return False
    salt = base64.b64decode(salt_b64.encode("ascii"))
    expected = base64.b64decode(digest_b64.encode("ascii"))
    actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, int(iterations))
    return hmac.compare_digest(actual, expected)


def _user_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {"id": int(row["id"]), "email": str(row["email"]), "createdAt": str(row["created_at"])}


def create_user(email: str, password: str) -> dict[str, Any]:
    email = email.strip().lower()
    if not email or "@" not in email:
        raise ValueError("Enter a valid email address")
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")
    init_db()
    try:
        with db_connection() as conn:
            cursor = conn.execute(
                "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
                (email, _hash_password(password), utc_now()),
            )
            row = conn.execute("SELECT id, email, created_at FROM users WHERE id = ?", (cursor.lastrowid,)).fetchone()
    except sqlite3.IntegrityError as exc:
        raise ValueError("An account with this email already exists") from exc
    return _user_dict(row)


def authenticate_user(email: str, password: str) -> dict[str, Any] | None:
    init_db()
    with db_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),)).fetchone()
    if not row or not _verify_password(password, str(row["password_hash"])):
        return None
    return _user_dict(row)


def create_session(user_id: int) -> str:
    init_db()
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=SESSION_DAYS)
    with db_connection() as conn:
        conn.execute(
            "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
            (token, user_id, now.isoformat(), expires.isoformat()),
        )
    return token


def delete_session(token: str) -> None:
    init_db()
    with db_connection() as conn:
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))


def user_from_token(token: str | None) -> dict[str, Any] | None:
    if not token:
        return None
    init_db()
    with db_connection() as conn:
        row = conn.execute(
            """
            SELECT users.id, users.email, users.created_at, sessions.expires_at
            FROM sessions
            JOIN users ON users.id = sessions.user_id
            WHERE sessions.token = ?
            """,
            (token,),
        ).fetchone()
    if not row:
        return None
    expires_at = datetime.fromisoformat(str(row["expires_at"]))
    if expires_at <= datetime.now(timezone.utc):
        delete_session(token)
        return None
    return _user_dict(row)


def save_match_run(user_id: int, payload: dict[str, Any]) -> int:
    init_db()
    with db_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO match_runs (user_id, source, source_url, fetched_at, job_count, new_count, ai_enabled, jobs_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                payload.get("source", ""),
                payload.get("sourceUrl", ""),
                payload.get("fetchedAt", ""),
                int(payload.get("count", 0) or 0),
                int(payload.get("newCount", 0) or 0),
                1 if payload.get("aiRecommendationsEnabled") else 0,
                json.dumps(payload.get("jobs", [])),
                utc_now(),
            ),
        )
    return int(cursor.lastrowid)


def list_match_runs(user_id: int, limit: int = 10) -> list[dict[str, Any]]:
    init_db()
    with db_connection() as conn:
        rows = conn.execute(
            """
            SELECT id, source, source_url, fetched_at, job_count, new_count, ai_enabled, created_at
            FROM match_runs
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT ?
            """,
            (user_id, limit),
        ).fetchall()
    return [
        {
            "id": int(row["id"]),
            "source": row["source"],
            "sourceUrl": row["source_url"],
            "fetchedAt": row["fetched_at"],
            "count": int(row["job_count"]),
            "newCount": int(row["new_count"]),
            "aiEnabled": bool(row["ai_enabled"]),
            "createdAt": row["created_at"],
        }
        for row in rows
    ]


def save_user_match(user_id: int, job: dict[str, Any], status: str = "Saved", notes: str = "") -> dict[str, Any]:
    if status not in STATUSES:
        raise ValueError("Status must be Saved, Applied, or Skipped")
    init_db()
    job_id = str(job.get("backendId") or job.get("id") or "")
    if not job_id:
        raise ValueError("Missing job id")
    now = utc_now()
    apply_url = str(job.get("applyUrl") or job.get("applicationLink") or "")
    with db_connection() as conn:
        conn.execute(
            """
            INSERT INTO saved_matches (
                user_id, job_id, company, title, location, apply_url, source, posted, match_score,
                status, notes, job_json, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(user_id, job_id) DO UPDATE SET
                company = excluded.company,
                title = excluded.title,
                location = excluded.location,
                apply_url = excluded.apply_url,
                source = excluded.source,
                posted = excluded.posted,
                match_score = excluded.match_score,
                status = excluded.status,
                notes = excluded.notes,
                job_json = excluded.job_json,
                updated_at = excluded.updated_at
            """,
            (
                user_id,
                job_id,
                str(job.get("company", "")),
                str(job.get("title") or job.get("role") or ""),
                str(job.get("location", "")),
                apply_url,
                str(job.get("source", "")),
                str(job.get("posted", "")),
                float(job.get("matchScore") or job.get("score") or 0),
                status,
                notes,
                json.dumps(job),
                now,
                now,
            ),
        )
    return {"jobId": job_id, "status": status}


def list_saved_matches(user_id: int) -> list[dict[str, Any]]:
    init_db()
    with db_connection() as conn:
        rows = conn.execute(
            """
            SELECT * FROM saved_matches
            WHERE user_id = ?
            ORDER BY updated_at DESC
            """,
            (user_id,),
        ).fetchall()
    results = []
    for row in rows:
        try:
            job = json.loads(str(row["job_json"]))
        except json.JSONDecodeError:
            job = {}
        job.update(
            {
                "savedStatus": row["status"],
                "status": row["status"],
                "notes": row["notes"] or "",
                "savedAt": row["created_at"],
                "updatedAt": row["updated_at"],
            }
        )
        results.append(job)
    return results


def saved_status_map(user_id: int) -> dict[str, dict[str, str]]:
    init_db()
    with db_connection() as conn:
        rows = conn.execute(
            "SELECT job_id, status, notes FROM saved_matches WHERE user_id = ?",
            (user_id,),
        ).fetchall()
    return {str(row["job_id"]): {"status": str(row["status"]), "notes": str(row["notes"] or "")} for row in rows}


def delete_saved_match(user_id: int, job_id: str) -> None:
    init_db()
    with db_connection() as conn:
        conn.execute("DELETE FROM saved_matches WHERE user_id = ? AND job_id = ?", (user_id, job_id))


def user_summary(user_id: int) -> dict[str, int]:
    init_db()
    with db_connection() as conn:
        rows = conn.execute(
            "SELECT status, COUNT(*) as count FROM saved_matches WHERE user_id = ? GROUP BY status",
            (user_id,),
        ).fetchall()
        runs = conn.execute("SELECT COUNT(*) as count FROM match_runs WHERE user_id = ?", (user_id,)).fetchone()
    summary = {"Saved": 0, "Applied": 0, "Skipped": 0, "Match runs": int(runs["count"] if runs else 0)}
    for row in rows:
        summary[str(row["status"])] = int(row["count"])
    return summary
