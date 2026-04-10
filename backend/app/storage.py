"""
Supabase Storage helpers.

upload_clip  — uploads a rendered clip .mp4 and returns its public URL.
upload_raw   — uploads the original uploaded video (private bucket).
upload_private_artifact / download_private_artifact — persist sidecar files
like raw clips and subtitle word JSON so Railway restarts do not break editing.
Both are best-effort: if Supabase is unavailable the pipeline still works,
clips are just served from Railway disk instead.
"""

import os
import urllib.request
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


def upload_private_artifact(
    job_id: str,
    artifact_name: str,
    local_path: str,
    content_type: str = "application/octet-stream",
) -> Optional[str]:
    """
    Upload a private artifact to the uploads bucket.
    Examples: raw clip mp4, words json, transcription cache, metadata json.
    """
    if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_KEY or not os.path.exists(local_path):
        return None
    try:
        from .supabase_client import get_client
        sb = get_client()

        object_path = f"{job_id}/{artifact_name}"

        with open(local_path, "rb") as f:
            sb.storage.from_(config.SUPABASE_UPLOADS_BUCKET).upload(
                path=object_path,
                file=f,
                file_options={"content-type": content_type, "upsert": "true"},
            )

        print(f"[STORAGE] Private artifact stored: {object_path}")
        return object_path

    except Exception as e:
        print(f"[STORAGE] Private artifact upload failed for {artifact_name} (non-fatal): {e}")
        return None


def download_private_artifact(job_id: str, artifact_name: str, local_path: str) -> bool:
    """
    Download a private artifact from the uploads bucket using the service role key.
    """
    if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_KEY:
        return False
    try:
        object_path = f"{job_id}/{artifact_name}"
        url = (
            f"{config.SUPABASE_URL}/storage/v1/object/"
            f"{config.SUPABASE_UPLOADS_BUCKET}/{object_path}"
        )
        req = urllib.request.Request(
            url,
            headers={
                "Authorization": f"Bearer {config.SUPABASE_SERVICE_KEY}",
                "apikey": config.SUPABASE_SERVICE_KEY,
            },
        )
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        with urllib.request.urlopen(req, timeout=60) as resp, open(local_path, "wb") as out:
            out.write(resp.read())
        print(f"[STORAGE] Private artifact restored: {object_path}")
        return True
    except Exception as e:
        print(f"[STORAGE] Private artifact download failed for {artifact_name} (non-fatal): {e}")
        return False


def download_public_clip(job_id: str, clip_name: str, local_path: str) -> bool:
    """
    Restore a rendered clip from the public clips bucket to local disk.
    """
    if not config.SUPABASE_URL:
        return False
    try:
        object_path = f"{job_id}/{clip_name}"
        url = (
            f"{config.SUPABASE_URL}/storage/v1/object/public/"
            f"{config.SUPABASE_CLIPS_BUCKET}/{object_path}"
        )
        req = urllib.request.Request(url)
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        with urllib.request.urlopen(req, timeout=60) as resp, open(local_path, "wb") as out:
            out.write(resp.read())
        print(f"[STORAGE] Public clip restored: {object_path}")
        return True
    except Exception as e:
        print(f"[STORAGE] Public clip download failed for {clip_name} (non-fatal): {e}")
        return False
