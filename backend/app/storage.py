"""
Supabase Storage helpers.

upload_clip  — uploads a rendered clip .mp4 and returns its public URL.
upload_raw   — uploads the original uploaded video (private bucket).
Both are best-effort: if Supabase is unavailable the pipeline still works,
clips are just served from Railway disk instead.
"""

import os
from pathlib import Path
from typing import Optional

from . import config


def upload_clip(job_id: str, clip_name: str, local_path: str) -> Optional[str]:
    """
    Upload a rendered clip to Supabase Storage `clips` bucket.
    Returns the public URL, or None if upload fails.
    Path inside bucket: {job_id}/{clip_name}
    """
    if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_KEY:
        return None
    try:
        from .supabase_client import get_client
        sb = get_client()

        object_path = f"{job_id}/{clip_name}"

        with open(local_path, "rb") as f:
            sb.storage.from_(config.SUPABASE_CLIPS_BUCKET).upload(
                path=object_path,
                file=f,
                file_options={"content-type": "video/mp4", "upsert": "true"},
            )

        # Build public URL
        public_url = (
            f"{config.SUPABASE_URL}/storage/v1/object/public/"
            f"{config.SUPABASE_CLIPS_BUCKET}/{object_path}"
        )
        print(f"[STORAGE] Uploaded {clip_name} → {public_url}")
        return public_url

    except Exception as e:
        import traceback
        print(f"[STORAGE] Upload failed for {clip_name} (non-fatal): {e}")
        traceback.print_exc()
        return None


def upload_raw(job_id: str, filename: str, local_path: str) -> Optional[str]:
    """
    Upload the original video to Supabase Storage `uploads` bucket (private).
    Returns the storage path, or None if upload fails.
    """
    if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_KEY:
        return None
    try:
        from .supabase_client import get_client
        sb = get_client()

        ext = Path(local_path).suffix
        object_path = f"{job_id}/original{ext}"

        with open(local_path, "rb") as f:
            sb.storage.from_(config.SUPABASE_UPLOADS_BUCKET).upload(
                path=object_path,
                file=f,
                file_options={"upsert": "true"},
            )

        print(f"[STORAGE] Raw upload stored: {object_path}")
        return object_path

    except Exception as e:
        print(f"[STORAGE] Raw upload failed (non-fatal): {e}")
        return None
