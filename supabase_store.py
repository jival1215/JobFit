from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any
import requests

try:
    from cryptography.fernet import Fernet, InvalidToken
except ImportError:
    Fernet = None

    class InvalidToken(Exception):
        pass

SESSION_DAYS = int(os.getenv("JOBFIT_SESSION_DAYS", "14") or 14)
STATUSES = {"Saved", "Applied", "Skipped"}


def configured() -> bool:
    return bool(os.getenv("SUPABASE_URL", "").strip() and os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip())


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _base_url() -> str:
    return os.getenv("SUPABASE_URL", "").strip().rstrip("/")


def _table(name: str) -> str:
    prefix = os.getenv("SUPABASE_TABLE_PREFIX", "jobfit_").strip()
    return f"{prefix}{name}"


def _headers(prefer: str | None = None) -> dict[str, str]:
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    return headers


def _request(method: str, table: str, *, params: dict[str, str] | None = None, payload: Any = None, prefer: str | None = None) -> Any:
    if not configured():
        raise RuntimeError("Supabase is not configured")
    response = requests.request(
        method,
        f"{_base_url()}/rest/v1/{_table(table)}",
        headers=_headers(prefer),
        params=params,
        json=payload,
        timeout=20,
    )
    if response.status_code >= 400:
        raise RuntimeError(f"Supabase {method} {_table(table)} failed: {response.status_code} {response.text}")
    if not response.text:
        return None
    return response.json()


def _eq(value: Any) -> str:
    return f"eq.{value}"


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


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


def encryption_enabled() -> bool:
    return bool(os.getenv("JOBFIT_ENCRYPTION_KEY", "").strip())


def _fernet():
    key = os.getenv("JOBFIT_ENCRYPTION_KEY", "").strip()
    if not key:
        return None
    if Fernet is None:
        raise RuntimeError("Install cryptography to use JOBFIT_ENCRYPTION_KEY")
    return Fernet(key.encode("utf-8"))


def _secure_encode(data: bytes) -> tuple[str, bool]:
    fernet = _fernet()
    if fernet:
        return fernet.encrypt(data).decode("utf-8"), True
    return base64.b64encode(data).decode("ascii"), False


def _secure_decode(value: str, encrypted: bool) -> bytes:
    if encrypted:
        fernet = _fernet()
        if not fernet:
            raise ValueError("Resume data is encrypted but JOBFIT_ENCRYPTION_KEY is not configured")
        try:
            return fernet.decrypt(value.encode("utf-8"))
        except InvalidToken as exc:
            raise ValueError("Could not decrypt stored resume data") from exc
    return base64.b64decode(value.encode("ascii"))


def _user_dict(row: dict[str, Any]) -> dict[str, Any]:
    return {"id": int(row["id"]), "email": str(row["email"]), "createdAt": str(row["created_at"])}


def create_user(email: str, password: str) -> dict[str, Any]:
    email = email.strip().lower()
    if not email or "@" not in email:
        raise ValueError("Enter a valid email address")
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters")
    existing = _request("GET", "users", params={"select": "id", "email": _eq(email)})
    if existing:
        raise ValueError("An account with this email already exists")
    rows = _request(
        "POST",
        "users",
        payload={"email": email, "password_hash": _hash_password(password), "created_at": utc_now()},
        prefer="return=representation",
    )
    return _user_dict(rows[0])


def authenticate_user(email: str, password: str) -> dict[str, Any] | None:
    rows = _request("GET", "users", params={"select": "*", "email": _eq(email.strip().lower()), "limit": "1"})
    if not rows or not _verify_password(password, str(rows[0].get("password_hash", ""))):
        return None
    return _user_dict(rows[0])


def create_session(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    expires = now + timedelta(days=SESSION_DAYS)
    _request(
        "POST",
        "sessions",
        payload={"token": _hash_token(token), "user_id": user_id, "created_at": now.isoformat(), "expires_at": expires.isoformat()},
        prefer="return=minimal",
    )
    return token


def delete_session(token: str) -> None:
    _request("DELETE", "sessions", params={"token": _eq(_hash_token(token))})


def user_from_token(token: str | None) -> dict[str, Any] | None:
    if not token:
        return None
    rows = _request("GET", "sessions", params={"select": "token,user_id,expires_at", "token": _eq(_hash_token(token)), "limit": "1"})
    if not rows:
        return None
    expires_at = datetime.fromisoformat(str(rows[0]["expires_at"]))
    if expires_at <= datetime.now(timezone.utc):
        delete_session(token)
        return None
    users = _request("GET", "users", params={"select": "id,email,created_at", "id": _eq(int(rows[0]["user_id"])), "limit": "1"})
    return _user_dict(users[0]) if users else None


def save_resume_record(user_id: int, filename: str, content_type: str, data: bytes, extracted_text: str) -> dict[str, Any]:
    now = utc_now()
    digest = hashlib.sha256(data).hexdigest()
    stored_file, file_encrypted = _secure_encode(data)
    stored_text, text_encrypted = _secure_encode(extracted_text.encode("utf-8"))
    encrypted = file_encrypted and text_encrypted
    rows = _request(
        "POST",
        "resumes",
        payload={
            "user_id": user_id,
            "filename": filename,
            "content_type": content_type,
            "file_size": len(data),
            "sha256": digest,
            "file_blob": stored_file,
            "extracted_text": stored_text,
            "encrypted": encrypted,
            "created_at": now,
        },
        prefer="return=representation",
    )
    return {
        "id": int(rows[0]["id"]),
        "filename": filename,
        "contentType": content_type,
        "fileSize": len(data),
        "sha256": digest,
        "encrypted": encrypted,
        "createdAt": now,
    }


def list_resumes(user_id: int, limit: int = 10) -> list[dict[str, Any]]:
    rows = _request(
        "GET",
        "resumes",
        params={"select": "id,filename,content_type,file_size,sha256,encrypted,created_at", "user_id": _eq(user_id), "order": "id.desc", "limit": str(limit)},
    )
    return [
        {
            "id": int(row["id"]),
            "filename": row["filename"],
            "contentType": row.get("content_type") or "",
            "fileSize": int(row.get("file_size") or 0),
            "sha256": row.get("sha256") or "",
            "encrypted": bool(row.get("encrypted")),
            "createdAt": row.get("created_at") or "",
        }
        for row in rows
    ]


def get_resume_record(user_id: int, resume_id: int, include_text: bool = False) -> dict[str, Any] | None:
    rows = _request("GET", "resumes", params={"select": "*", "user_id": _eq(user_id), "id": _eq(resume_id), "limit": "1"})
    if not rows:
        return None
    row = rows[0]
    result = {
        "id": int(row["id"]),
        "filename": row["filename"],
        "contentType": row.get("content_type") or "",
        "fileSize": int(row.get("file_size") or 0),
        "sha256": row.get("sha256") or "",
        "encrypted": bool(row.get("encrypted")),
        "createdAt": row.get("created_at") or "",
    }
    if include_text:
        result["extractedText"] = _secure_decode(str(row.get("extracted_text") or ""), bool(row.get("encrypted"))).decode("utf-8")
    return result


def delete_resume_record(user_id: int, resume_id: int) -> None:
    _request("DELETE", "resumes", params={"user_id": _eq(user_id), "id": _eq(resume_id)})


def save_match_run(user_id: int, payload: dict[str, Any]) -> int:
    rows = _request(
        "POST",
        "match_runs",
        payload={
            "user_id": user_id,
            "resume_id": payload.get("resumeId"),
            "source": payload.get("source", ""),
            "source_url": payload.get("sourceUrl", ""),
            "fetched_at": payload.get("fetchedAt", ""),
            "job_count": int(payload.get("count", 0) or 0),
            "new_count": int(payload.get("newCount", 0) or 0),
            "ai_enabled": bool(payload.get("aiRecommendationsEnabled")),
            "jobs_json": payload.get("jobs", []),
            "created_at": utc_now(),
        },
        prefer="return=representation",
    )
    return int(rows[0]["id"])


def list_match_runs(user_id: int, limit: int = 10) -> list[dict[str, Any]]:
    rows = _request(
        "GET",
        "match_runs",
        params={"select": "id,resume_id,source,source_url,fetched_at,job_count,new_count,ai_enabled,created_at", "user_id": _eq(user_id), "order": "id.desc", "limit": str(limit)},
    )
    return [
        {
            "id": int(row["id"]),
            "resumeId": int(row["resume_id"]) if row.get("resume_id") is not None else None,
            "source": row.get("source") or "",
            "sourceUrl": row.get("source_url") or "",
            "fetchedAt": row.get("fetched_at") or "",
            "count": int(row.get("job_count") or 0),
            "newCount": int(row.get("new_count") or 0),
            "aiEnabled": bool(row.get("ai_enabled")),
            "createdAt": row.get("created_at") or "",
        }
        for row in rows
    ]


def save_user_match(user_id: int, job: dict[str, Any], status: str = "Saved", notes: str = "") -> dict[str, Any]:
    if status not in STATUSES:
        raise ValueError("Status must be Saved, Applied, or Skipped")
    job_id = str(job.get("backendId") or job.get("id") or "")
    if not job_id:
        raise ValueError("Missing job id")
    now = utc_now()
    _request("DELETE", "saved_matches", params={"user_id": _eq(user_id), "job_id": _eq(job_id)})
    _request(
        "POST",
        "saved_matches",
        payload={
            "user_id": user_id,
            "job_id": job_id,
            "company": str(job.get("company", "")),
            "title": str(job.get("title") or job.get("role") or ""),
            "location": str(job.get("location", "")),
            "apply_url": str(job.get("applyUrl") or job.get("applicationLink") or ""),
            "source": str(job.get("source", "")),
            "posted": str(job.get("posted", "")),
            "match_score": float(job.get("matchScore") or job.get("score") or 0),
            "status": status,
            "notes": notes,
            "job_json": job,
            "created_at": now,
            "updated_at": now,
        },
        prefer="return=minimal",
    )
    return {"jobId": job_id, "status": status}


def list_saved_matches(user_id: int) -> list[dict[str, Any]]:
    rows = _request("GET", "saved_matches", params={"select": "*", "user_id": _eq(user_id), "order": "updated_at.desc"})
    results = []
    for row in rows:
        job = row.get("job_json") or {}
        if isinstance(job, str):
            try:
                job = json.loads(job)
            except json.JSONDecodeError:
                job = {}
        job.update({"savedStatus": row.get("status"), "status": row.get("status"), "notes": row.get("notes") or "", "savedAt": row.get("created_at"), "updatedAt": row.get("updated_at")})
        results.append(job)
    return results


def saved_status_map(user_id: int) -> dict[str, dict[str, str]]:
    rows = _request("GET", "saved_matches", params={"select": "job_id,status,notes", "user_id": _eq(user_id)})
    return {str(row["job_id"]): {"status": str(row.get("status") or ""), "notes": str(row.get("notes") or "")} for row in rows}


def delete_saved_match(user_id: int, job_id: str) -> None:
    _request("DELETE", "saved_matches", params={"user_id": _eq(user_id), "job_id": _eq(job_id)})


def user_summary(user_id: int) -> dict[str, int]:
    summary = {"Saved": 0, "Applied": 0, "Skipped": 0, "Match runs": 0, "Resumes": 0}
    rows = _request("GET", "saved_matches", params={"select": "status", "user_id": _eq(user_id)})
    for row in rows:
        status = str(row.get("status") or "")
        if status in summary:
            summary[status] += 1
    summary["Match runs"] = len(_request("GET", "match_runs", params={"select": "id", "user_id": _eq(user_id)}))
    summary["Resumes"] = len(_request("GET", "resumes", params={"select": "id", "user_id": _eq(user_id)}))
    return summary
