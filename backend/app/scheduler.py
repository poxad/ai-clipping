"""
TikTok OAuth + Content Posting API + SQLite-backed schedule queue.

Tables:
  tiktok_accounts  — connected TikTok accounts with access tokens
  scheduled_posts  — clips queued for auto-posting
"""

import asyncio
import hashlib
import os
import secrets
import sqlite3
import time
import uuid
from contextlib import contextmanager
from typing import Optional
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, BackgroundTasks, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

from . import config

# ---------------------------------------------------------------------------
# DB setup
# ---------------------------------------------------------------------------

DB_PATH = getattr(config, "DB_PATH", "scheduler.db")


def _init_db():
    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()
    cur.executescript("""
        CREATE TABLE IF NOT EXISTS tiktok_accounts (
            id TEXT PRIMARY KEY,
            open_id TEXT UNIQUE NOT NULL,
            display_name TEXT,
            avatar_url TEXT,
            access_token TEXT NOT NULL,
            refresh_token TEXT,
            expires_at INTEGER,
            created_at INTEGER DEFAULT (strftime('%s','now'))
        );

        CREATE TABLE IF NOT EXISTS scheduled_posts (
            id TEXT PRIMARY KEY,
            job_id TEXT NOT NULL,
            clip_name TEXT NOT NULL,
            clip_path TEXT NOT NULL,
            transcript TEXT,
            caption TEXT,
            account_id TEXT NOT NULL,
            scheduled_at INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            tiktok_publish_id TEXT,
            error_message TEXT,
            created_at INTEGER DEFAULT (strftime('%s','now'))
        );
    """)
    con.commit()
    con.close()


_init_db()

# Migrate existing databases that predate the caption column
try:
    _con = sqlite3.connect(DB_PATH)
    _con.execute("ALTER TABLE scheduled_posts ADD COLUMN caption TEXT")
    _con.commit()
    _con.close()
except Exception:
    pass  # Column already exists


@contextmanager
def get_db():
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    try:
        yield con
    finally:
        con.close()


# ---------------------------------------------------------------------------
# TikTok OAuth helpers
# ---------------------------------------------------------------------------

TIKTOK_AUTH_BASE = "https://www.tiktok.com/v2/auth/authorize/"
TIKTOK_TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/"
TIKTOK_USER_URL = "https://open.tiktokapis.com/v2/user/info/"
TIKTOK_PUBLISH_INIT_URL = "https://open.tiktokapis.com/v2/post/publish/video/init/"
TIKTOK_PUBLISH_STATUS_URL = "https://open.tiktokapis.com/v2/post/publish/status/fetch/"

# In-memory CSRF state store (maps state → {timestamp, code_verifier})
_oauth_states: dict = {}

SCOPES = "user.info.basic,video.upload,video.publish"


def _pkce_pair() -> tuple[str, str]:
    """Generate a PKCE code_verifier and code_challenge (S256)."""
    verifier = secrets.token_urlsafe(64)
    digest = hashlib.sha256(verifier.encode()).digest()
    import base64
    challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    return verifier, challenge


def _build_auth_url() -> tuple[str, str]:
    """Return (auth_url, state). State is used for CSRF verification."""
    state = secrets.token_urlsafe(16)
    code_verifier, code_challenge = _pkce_pair()
    # Clean up states older than 10 minutes
    cutoff = time.time() - 600
    for k in list(_oauth_states):
        if _oauth_states[k]["ts"] < cutoff:
            del _oauth_states[k]
    _oauth_states[state] = {"ts": time.time(), "verifier": code_verifier}
    params = {
        "client_key": config.TIKTOK_CLIENT_KEY,
        "scope": SCOPES,
        "response_type": "code",
        "redirect_uri": config.TIKTOK_REDIRECT_URI,
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
    }
    return TIKTOK_AUTH_BASE + "?" + urlencode(params), state


async def _exchange_code(code: str, code_verifier: str) -> dict:
    """Exchange authorization code for access + refresh tokens."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            TIKTOK_TOKEN_URL,
            data={
                "client_key": config.TIKTOK_CLIENT_KEY,
                "client_secret": config.TIKTOK_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": config.TIKTOK_REDIRECT_URI,
                "code_verifier": code_verifier,
            },
        )
    resp.raise_for_status()
    return resp.json()


async def _get_user_info(access_token: str) -> dict:
    """Fetch basic user info (open_id, display_name, avatar_url)."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            TIKTOK_USER_URL,
            params={"fields": "open_id,display_name,avatar_url"},
            headers={"Authorization": f"Bearer {access_token}"},
        )
    resp.raise_for_status()
    data = resp.json()
    return data.get("data", {}).get("user", {})


async def _refresh_token(account_id: str) -> Optional[str]:
    """Refresh an expired access token. Returns new access_token or None on failure."""
    with get_db() as con:
        row = con.execute(
            "SELECT refresh_token FROM tiktok_accounts WHERE id=?", (account_id,)
        ).fetchone()
    if not row or not row["refresh_token"]:
        return None
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                TIKTOK_TOKEN_URL,
                data={
                    "client_key": config.TIKTOK_CLIENT_KEY,
                    "client_secret": config.TIKTOK_CLIENT_SECRET,
                    "grant_type": "refresh_token",
                    "refresh_token": row["refresh_token"],
                },
            )
        resp.raise_for_status()
        tokens = resp.json()
        new_token = tokens.get("access_token")
        new_refresh = tokens.get("refresh_token", row["refresh_token"])
        expires_in = tokens.get("expires_in", 86400)
        with get_db() as con:
            con.execute(
                "UPDATE tiktok_accounts SET access_token=?, refresh_token=?, expires_at=? WHERE id=?",
                (new_token, new_refresh, int(time.time()) + expires_in, account_id),
            )
            con.commit()
        return new_token
    except Exception as e:
        print(f"[SCHEDULER] Token refresh failed for {account_id}: {e}")
        return None


# ---------------------------------------------------------------------------
# TikTok posting
# ---------------------------------------------------------------------------

async def _post_clip_to_tiktok(post_id: str):
    """Upload and publish one scheduled post. Updates status in DB."""
    with get_db() as con:
        row = con.execute(
            """SELECT sp.*, ta.access_token, ta.expires_at
               FROM scheduled_posts sp
               JOIN tiktok_accounts ta ON ta.id = sp.account_id
               WHERE sp.id = ?""",
            (post_id,),
        ).fetchone()
    if not row:
        return

    # Set status → posting
    with get_db() as con:
        con.execute("UPDATE scheduled_posts SET status='posting' WHERE id=?", (post_id,))
        con.commit()

    try:
        clip_path = row["clip_path"]
        if not os.path.exists(clip_path):
            # Try to restore from Supabase Storage (Railway ephemeral filesystem)
            from .storage import download_public_clip
            restored = download_public_clip(row["job_id"], row["clip_name"], clip_path)
            if not restored or not os.path.exists(clip_path):
                raise FileNotFoundError(f"Clip file not found locally or in storage: {row['clip_name']}")

        video_size = os.path.getsize(clip_path)
        access_token = row["access_token"]

        # Refresh token if expired
        if row["expires_at"] and int(time.time()) >= row["expires_at"] - 60:
            refreshed = await _refresh_token(row["account_id"])
            if refreshed:
                access_token = refreshed
            else:
                raise ValueError("Access token expired and refresh failed. Re-authorize the account.")

        # 1. Init upload
        async with httpx.AsyncClient(timeout=30) as client:
            init_resp = await client.post(
                TIKTOK_PUBLISH_INIT_URL,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json; charset=UTF-8",
                },
                json={
                    "post_info": {
                        "title": (row["caption"] or row["transcript"] or row["clip_name"])[:150],
                        "privacy_level": "SELF_ONLY",
                        "disable_duet": False,
                        "disable_comment": False,
                        "disable_stitch": False,
                    },
                    "source_info": {
                        "source": "FILE_UPLOAD",
                        "video_size": video_size,
                        "chunk_size": video_size,
                        "total_chunk_count": 1,
                    },
                },
            )
        print(f"[SCHEDULER] TikTok init response: status={init_resp.status_code} body={init_resp.text[:1000]}")
        try:
            init_data = init_resp.json()
        except Exception:
            raise ValueError(f"TikTok init returned non-JSON (HTTP {init_resp.status_code}): {init_resp.text[:300]}")
        if init_resp.status_code != 200 or init_data.get("error", {}).get("code") != "ok":
            err = init_data.get("error", {})
            raise ValueError(f"TikTok init failed [{err.get('code')}]: {err.get('message', init_data)}")

        upload_url = init_data["data"]["upload_url"]
        publish_id = init_data["data"]["publish_id"]

        # 2. Upload video
        with open(clip_path, "rb") as f:
            video_bytes = f.read()
        async with httpx.AsyncClient(timeout=120) as client:
            upload_resp = await client.put(
                upload_url,
                content=video_bytes,
                headers={
                    "Content-Type": "video/mp4",
                    "Content-Range": f"bytes 0-{video_size - 1}/{video_size}",
                },
            )
        if upload_resp.status_code not in (200, 201, 206):
            raise ValueError(f"TikTok video upload failed: {upload_resp.status_code}")

        # 3. Poll publish status (up to 60s)
        final_status = "PROCESSING_UPLOAD"
        for _ in range(12):
            await asyncio.sleep(5)
            async with httpx.AsyncClient(timeout=15) as client:
                status_resp = await client.post(
                    TIKTOK_PUBLISH_STATUS_URL,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json; charset=UTF-8",
                    },
                    json={"publish_id": publish_id},
                )
            status_data = status_resp.json()
            final_status = status_data.get("data", {}).get("status", "PROCESSING_UPLOAD")
            if final_status in ("PUBLISH_COMPLETE", "FAILED"):
                break

        if final_status == "PUBLISH_COMPLETE":
            with get_db() as con:
                con.execute(
                    "UPDATE scheduled_posts SET status='posted', tiktok_publish_id=? WHERE id=?",
                    (publish_id, post_id),
                )
                con.commit()
            print(f"[SCHEDULER] ✓ Posted {row['clip_name']} (publish_id={publish_id})")
        else:
            raise ValueError(f"TikTok publish ended with status: {final_status}")

    except Exception as exc:
        print(f"[SCHEDULER] ✗ Failed to post {post_id}: {exc}")
        with get_db() as con:
            con.execute(
                "UPDATE scheduled_posts SET status='failed', error_message=? WHERE id=?",
                (str(exc), post_id),
            )
            con.commit()


# ---------------------------------------------------------------------------
# Background scheduler loop
# ---------------------------------------------------------------------------

async def scheduler_loop():
    """Check every 60s for due posts and fire them."""
    print("[SCHEDULER] Background scheduler started")
    while True:
        try:
            now = int(time.time())
            with get_db() as con:
                due = con.execute(
                    "SELECT id FROM scheduled_posts WHERE status='pending' AND scheduled_at <= ?",
                    (now,),
                ).fetchall()
            for row in due:
                print(f"[SCHEDULER] Firing post {row['id']}")
                asyncio.create_task(_post_clip_to_tiktok(row["id"]))
        except Exception as e:
            print(f"[SCHEDULER] Loop error: {e}")
        await asyncio.sleep(60)


# ---------------------------------------------------------------------------
# API Router
# ---------------------------------------------------------------------------

router = APIRouter(prefix="/api")


# ─── TikTok OAuth ────────────────────────────────────────────────────────────

@router.get("/tiktok/auth-url")
async def tiktok_auth_url():
    if not config.TIKTOK_CLIENT_KEY:
        raise HTTPException(503, "TikTok integration not configured. Add TIKTOK_CLIENT_KEY to .env")
    url, state = _build_auth_url()
    return {"url": url, "state": state}


@router.get("/tiktok/callback")
async def tiktok_callback(code: str = "", state: str = "", error: str = ""):
    if error:
        return RedirectResponse(f"{config.FRONTEND_URL}/scheduler?error={error}")
    if not code:
        raise HTTPException(400, "Missing authorization code")
    if state not in _oauth_states:
        raise HTTPException(400, "Invalid or expired OAuth state")
    code_verifier = _oauth_states.pop(state)["verifier"]

    try:
        tokens = await _exchange_code(code, code_verifier)
        access_token = tokens.get("access_token")
        refresh_token = tokens.get("refresh_token")
        expires_in = tokens.get("expires_in", 86400)
        if not access_token:
            raise ValueError(f"No access_token in response: {tokens}")

        user = await _get_user_info(access_token)
        open_id = user.get("open_id") or tokens.get("open_id")
        if not open_id:
            raise ValueError("Could not get open_id from TikTok")

        account_id = str(uuid.uuid4())
        with get_db() as con:
            # Upsert: update if open_id already exists
            existing = con.execute(
                "SELECT id FROM tiktok_accounts WHERE open_id=?", (open_id,)
            ).fetchone()
            if existing:
                con.execute(
                    "UPDATE tiktok_accounts SET access_token=?, refresh_token=?, expires_at=?, display_name=?, avatar_url=? WHERE open_id=?",
                    (access_token, refresh_token, int(time.time()) + expires_in,
                     user.get("display_name"), user.get("avatar_url"), open_id),
                )
            else:
                con.execute(
                    "INSERT INTO tiktok_accounts (id, open_id, display_name, avatar_url, access_token, refresh_token, expires_at) VALUES (?,?,?,?,?,?,?)",
                    (account_id, open_id, user.get("display_name"), user.get("avatar_url"),
                     access_token, refresh_token, int(time.time()) + expires_in),
                )
            con.commit()

        return RedirectResponse(f"{config.FRONTEND_URL}/scheduler?connected=1")
    except Exception as exc:
        print(f"[TIKTOK] OAuth callback error: {exc}")
        return RedirectResponse(f"{config.FRONTEND_URL}/scheduler?error=oauth_failed")


@router.get("/tiktok/accounts")
async def list_accounts():
    with get_db() as con:
        rows = con.execute(
            "SELECT id, open_id, display_name, avatar_url, created_at FROM tiktok_accounts ORDER BY created_at DESC"
        ).fetchall()
    return [dict(r) for r in rows]


@router.delete("/tiktok/accounts/{account_id}")
async def delete_account(account_id: str):
    with get_db() as con:
        con.execute("DELETE FROM tiktok_accounts WHERE id=?", (account_id,))
        con.commit()
    return {"ok": True}


# ─── Schedule CRUD ───────────────────────────────────────────────────────────

class ScheduleRequest(BaseModel):
    job_id: str
    clip_name: str
    account_id: str
    scheduled_at: int   # unix timestamp
    transcript: Optional[str] = None
    caption: Optional[str] = None


@router.post("/schedule")
async def create_schedule(req: ScheduleRequest):
    # Verify account exists
    with get_db() as con:
        acc = con.execute("SELECT id FROM tiktok_accounts WHERE id=?", (req.account_id,)).fetchone()
    if not acc:
        raise HTTPException(404, "TikTok account not found")

    # Build clip path from job outputs dir
    clip_path = os.path.join(config.OUTPUT_DIR, req.job_id, req.clip_name)

    post_id = str(uuid.uuid4())
    with get_db() as con:
        con.execute(
            "INSERT INTO scheduled_posts (id, job_id, clip_name, clip_path, transcript, caption, account_id, scheduled_at) VALUES (?,?,?,?,?,?,?,?)",
            (post_id, req.job_id, req.clip_name, clip_path, req.transcript, req.caption, req.account_id, req.scheduled_at),
        )
        con.commit()
    return {"id": post_id}


@router.get("/schedule")
async def list_schedule():
    with get_db() as con:
        rows = con.execute(
            """SELECT sp.id, sp.job_id, sp.clip_name, sp.transcript, sp.caption,
                      sp.scheduled_at, sp.status, sp.tiktok_publish_id,
                      sp.error_message, sp.created_at,
                      ta.id as account_id, ta.display_name, ta.avatar_url, ta.open_id
               FROM scheduled_posts sp
               JOIN tiktok_accounts ta ON ta.id = sp.account_id
               ORDER BY sp.scheduled_at ASC"""
        ).fetchall()
    results = []
    for r in rows:
        results.append({
            "id": r["id"],
            "job_id": r["job_id"],
            "clip_name": r["clip_name"],
            "caption": r["caption"],
            "transcript": r["transcript"],
            "scheduled_at": r["scheduled_at"],
            "status": r["status"],
            "tiktok_publish_id": r["tiktok_publish_id"],
            "error_message": r["error_message"],
            "created_at": r["created_at"],
            "account": {
                "id": r["account_id"],
                "open_id": r["open_id"],
                "display_name": r["display_name"],
                "avatar_url": r["avatar_url"],
            },
        })
    return results


@router.delete("/schedule/{post_id}")
async def cancel_schedule(post_id: str):
    with get_db() as con:
        con.execute(
            "UPDATE scheduled_posts SET status='cancelled' WHERE id=? AND status='pending'",
            (post_id,),
        )
        con.commit()
    return {"ok": True}


@router.patch("/schedule/{post_id}")
async def update_schedule(post_id: str, body: dict):
    scheduled_at = body.get("scheduled_at")
    if not scheduled_at:
        raise HTTPException(400, "scheduled_at required")
    with get_db() as con:
        con.execute(
            "UPDATE scheduled_posts SET scheduled_at=?, status='pending', error_message=NULL WHERE id=?",
            (int(scheduled_at), post_id),
        )
        con.commit()
    return {"ok": True}


@router.delete("/schedule/{post_id}/delete")
async def delete_schedule(post_id: str):
    with get_db() as con:
        con.execute("DELETE FROM scheduled_posts WHERE id=?", (post_id,))
        con.commit()
    return {"ok": True}


@router.post("/schedule/{post_id}/post-now")
async def post_now(post_id: str):
    with get_db() as con:
        row = con.execute(
            "SELECT status FROM scheduled_posts WHERE id=?", (post_id,)
        ).fetchone()
    if not row:
        raise HTTPException(404, "Scheduled post not found")
    if row["status"] not in ("pending", "failed"):
        raise HTTPException(400, f"Cannot post now — current status: {row['status']}")

    # Reset to pending so scheduler picks it up immediately
    with get_db() as con:
        con.execute(
            "UPDATE scheduled_posts SET status='pending', scheduled_at=?, error_message=NULL WHERE id=?",
            (int(time.time()), post_id),
        )
        con.commit()

    # Fire immediately in background
    asyncio.create_task(_post_clip_to_tiktok(post_id))
    return {"ok": True}
