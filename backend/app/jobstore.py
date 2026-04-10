"""
Job store — SQLite (local, fast) + Supabase Postgres (persistent, survives restarts).

SQLite is the primary source for in-flight polling (fast, no network hop).
Supabase is written to on every update so jobs survive Railway restarts and
are queryable by the frontend (history page, per-user filtering).
"""

import json
import sqlite3
import threading
from typing import Optional

from . import config

_lock = threading.Lock()


def _conn() -> sqlite3.Connection:
    conn = sqlite3.connect(config.DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with _lock, _conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                job_id   TEXT PRIMARY KEY,
                status   TEXT NOT NULL DEFAULT 'pending',
                progress INTEGER NOT NULL DEFAULT 0,
                message  TEXT NOT NULL DEFAULT '',
                logs     TEXT NOT NULL DEFAULT '[]',
                clips    TEXT NOT NULL DEFAULT '[]',
                user_id  TEXT,
                filename TEXT,
                updated  INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
            )
        """)
        # Migrate: add user_id and filename if they don't exist yet
        for col in ("user_id TEXT", "filename TEXT"):
            try:
                conn.execute(f"ALTER TABLE jobs ADD COLUMN {col}")
            except Exception:
                pass
        conn.commit()


# ── Supabase helpers (best-effort, fire-and-forget background thread) ────────

def _sb_run(fn):
    """Run a Supabase operation in a background thread. Never blocks callers."""
    t = threading.Thread(target=fn, daemon=False)
    t.start()


def _sb_upsert(job_id: str, data: dict):
    """Upsert a row into Supabase jobs table. Creates the row if missing, updates if present."""
    def _run():
        try:
            from .supabase_client import get_client
            get_client().table("jobs").upsert(
                {"job_id": job_id, **data},
                on_conflict="job_id",
            ).execute()
            print(f"[SUPABASE] upserted job {job_id} status={data.get('status', '?')}")
        except Exception as e:
            print(f"[SUPABASE] upsert failed (non-fatal): {e}")
    _sb_run(_run)


# ── Public API ────────────────────────────────────────────────────────────────

def create_job(job_id: str, status: str = "pending", progress: int = 0,
               message: str = "", logs: Optional[list] = None,
               clips: Optional[list] = None, user_id: Optional[str] = None,
               filename: Optional[str] = None):
    logs = logs or []
    clips = clips or []

    # SQLite — store user_id and filename so update_job can include them in upserts
    with _lock, _conn() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO jobs "
            "(job_id, status, progress, message, logs, clips, user_id, filename) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (job_id, status, progress, message, json.dumps(logs), json.dumps(clips),
             user_id, filename)
        )
        conn.commit()

    # Supabase — upsert (handles duplicate job_id if job is retried)
    sb_data: dict = {
        "status": status, "progress": progress,
        "message": message, "clips": clips, "logs": logs,
    }
    if user_id:
        sb_data["user_id"] = user_id
    if filename:
        sb_data["filename"] = filename
    _sb_upsert(job_id, sb_data)


def update_job(job_id: str, **kwargs):
    """Update one or more fields. Appends message to logs if new."""
    if not kwargs:
        return

    with _lock, _conn() as conn:
        row = conn.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,)).fetchone()
        if not row:
            return

        status   = kwargs.get("status",   row["status"])
        progress = kwargs.get("progress", row["progress"])
        message  = kwargs.get("message",  row["message"])
        clips    = kwargs.get("clips",    json.loads(row["clips"]))

        # Preserve user_id from SQLite so every Supabase upsert keeps it
        try:
            user_id = row["user_id"]
        except (IndexError, KeyError):
            user_id = None

        try:
            filename = row["filename"]
        except (IndexError, KeyError):
            filename = None

        existing_logs: list = json.loads(row["logs"])
        if "message" in kwargs and kwargs["message"]:
            if not existing_logs or existing_logs[-1] != kwargs["message"]:
                existing_logs.append(kwargs["message"])

        conn.execute(
            "UPDATE jobs SET status=?, progress=?, message=?, logs=?, clips=?, "
            "updated=strftime('%s','now') WHERE job_id=?",
            (status, progress, message, json.dumps(existing_logs), json.dumps(clips), job_id)
        )
        conn.commit()

    # Supabase — upsert so the row is created even if create_job's upsert failed
    sb_data: dict = {
        "status": status, "progress": progress,
        "message": message, "clips": clips, "logs": existing_logs,
    }
    if user_id:
        sb_data["user_id"] = user_id
    if filename:
        sb_data["filename"] = filename
    _sb_upsert(job_id, sb_data)


def get_job(job_id: str) -> Optional[dict]:
    with _lock, _conn() as conn:
        row = conn.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,)).fetchone()
        if not row:
            return None
        return {
            "status":   row["status"],
            "progress": row["progress"],
            "message":  row["message"],
            "logs":     json.loads(row["logs"]),
            "clips":    json.loads(row["clips"]),
        }


def job_exists(job_id: str) -> bool:
    with _lock, _conn() as conn:
        row = conn.execute("SELECT 1 FROM jobs WHERE job_id = ?", (job_id,)).fetchone()
        return row is not None
