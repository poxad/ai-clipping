"""
Supabase-backed clip persistence.

This keeps per-clip subtitle state in Postgres so subtitle editing does not
depend solely on sidecar files surviving on local disk or storage restores.
"""

from __future__ import annotations

from typing import Optional


def _get_table():
    from .supabase_client import get_client
    return get_client().table("job_clips")


def _clip_payload(job_id: str, clip: dict, subtitle_words: Optional[list] = None, subtitle_style: Optional[dict] = None) -> dict:
    clip_name = clip.get("name", "")
    return {
        "job_id": job_id,
        "clip_name": clip_name,
        "clip_index": clip.get("index", 1),
        "video_url": clip.get("url"),
        "raw_artifact_name": clip_name.replace(".mp4", "_raw.mp4") if clip_name else None,
        "words_artifact_name": clip_name.replace(".mp4", "_words.json") if clip_name else None,
        "transcript": clip.get("transcript", "") or "",
        "subtitle_words": subtitle_words if subtitle_words is not None else [],
        "subtitle_style": subtitle_style if subtitle_style is not None else {},
        "source": clip.get("source"),
        "clip_start": clip.get("start"),
        "clip_end": clip.get("end"),
        "duration": clip.get("duration"),
        "score": clip.get("score"),
        "score_summary": clip.get("score_summary"),
        "caption": clip.get("caption"),
        "clip_type": clip.get("clip_type"),
        "score_metrics": clip.get("score_metrics") or {},
    }


def upsert_clip(job_id: str, clip: dict, subtitle_words: Optional[list] = None, subtitle_style: Optional[dict] = None) -> None:
    try:
        _get_table().upsert(
            _clip_payload(job_id, clip, subtitle_words=subtitle_words, subtitle_style=subtitle_style),
            on_conflict="job_id,clip_name",
        ).execute()
        print(f"[SUPABASE] upserted job_clips row {job_id}/{clip.get('name')}")
    except Exception as e:
        print(f"[SUPABASE] job_clips upsert failed (non-fatal): {e}")


def get_clip(job_id: str, clip_name: str) -> Optional[dict]:
    try:
        resp = (
            _get_table()
            .select("*")
            .eq("job_id", job_id)
            .eq("clip_name", clip_name)
            .limit(1)
            .execute()
        )
        rows = resp.data or []
        return rows[0] if rows else None
    except Exception as e:
        print(f"[SUPABASE] job_clips fetch failed (non-fatal): {e}")
        return None


def get_subtitle_words(job_id: str, clip_name: str) -> Optional[list]:
    row = get_clip(job_id, clip_name)
    if not row:
        return None
    words = row.get("subtitle_words")
    return words if isinstance(words, list) and words else None


def save_subtitle_state(
    job_id: str,
    clip_name: str,
    subtitle_words: list,
    subtitle_style: Optional[dict] = None,
    video_url: Optional[str] = None,
    transcript: Optional[str] = None,
) -> None:
    try:
        existing = get_clip(job_id, clip_name) or {}
        payload = {
            "job_id": job_id,
            "clip_name": clip_name,
            "clip_index": existing.get("clip_index", 1),
            "raw_artifact_name": existing.get("raw_artifact_name") or clip_name.replace(".mp4", "_raw.mp4"),
            "words_artifact_name": existing.get("words_artifact_name") or clip_name.replace(".mp4", "_words.json"),
            "subtitle_words": subtitle_words,
        }
        if subtitle_style is not None:
            payload["subtitle_style"] = subtitle_style
        if video_url is not None:
            payload["video_url"] = video_url
        if transcript is not None:
            payload["transcript"] = transcript

        _get_table().upsert(payload, on_conflict="job_id,clip_name").execute()
        print(f"[SUPABASE] updated subtitle state {job_id}/{clip_name}")
    except Exception as e:
        print(f"[SUPABASE] subtitle state update failed (non-fatal): {e}")
