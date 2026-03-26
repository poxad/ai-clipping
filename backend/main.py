"""
FastAPI application — AI Clipping Platform
Endpoints: upload, status, video streaming, ZIP download
"""

import io
import os
import shutil
import uuid
import zipfile
import asyncio
from pathlib import Path
from typing import Dict

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from . import config
from .clipper import build_clips, create_clip_video
from .transcriber import extract_audio, transcribe

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(title="AI Clipping Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(config.UPLOAD_DIR, exist_ok=True)
os.makedirs(config.OUTPUT_DIR, exist_ok=True)

# In-memory job store (prototype — replace with SQLite/Redis for production)
jobs: Dict[str, dict] = {}

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _update_job(job_id: str, **kwargs):
    jobs[job_id].update(kwargs)


def _job_dir(job_id: str) -> str:
    return os.path.join(config.OUTPUT_DIR, job_id)


# ---------------------------------------------------------------------------
# Background processing pipeline
# ---------------------------------------------------------------------------

async def _process_video(job_id: str, video_path: str):
    jdir = _job_dir(job_id)
    os.makedirs(jdir, exist_ok=True)

    try:
        # 1. Extract audio
        _update_job(job_id, status="extracting", progress=5,
                    message="Extracting audio from video...")
        audio_path = os.path.join(jdir, "audio.mp3")
        await asyncio.to_thread(extract_audio, video_path, audio_path)

        # 2. Transcribe
        _update_job(job_id, status="transcribing", progress=15,
                    message="Transcribing audio with Whisper... (this may take a few minutes for long videos)")
        words = await asyncio.to_thread(transcribe, audio_path)

        if not words:
            _update_job(job_id, status="error", progress=0,
                        message="No speech detected in the video. Please check the audio.")
            return

        _update_job(job_id, progress=40,
                    message=f"Transcribed {len(words)} words. Analyzing scenes...")

        # 3. Build clips from transcript
        clips = await asyncio.to_thread(build_clips, words)

        if not clips:
            _update_job(job_id, status="error", progress=0,
                        message="No suitable clips found. The video may be too short or mostly silence.")
            return

        _update_job(job_id, progress=50,
                    message=f"Found {len(clips)} clips. Rendering videos...")

        # 4. Render each clip
        generated = []
        for i, clip in enumerate(clips):
            clip_name = f"clip_{clip.index:03d}.mp4"
            clip_path = os.path.join(jdir, clip_name)

            progress = 50 + int((i / len(clips)) * 45)
            _update_job(job_id, progress=progress,
                        message=f"Rendering clip {i + 1} of {len(clips)}...")

            success = await asyncio.to_thread(
                create_clip_video, video_path, clip, clip_path
            )

            if success:
                generated.append({
                    "name": clip_name,
                    "index": clip.index,
                    "transcript": clip.transcript,
                    "start": round(clip.start, 2),
                    "end": round(clip.end, 2),
                    "duration": round(clip.wall_duration, 1),
                    "url": f"/api/video/{job_id}/{clip_name}",
                })

        _update_job(
            job_id,
            status="done",
            progress=100,
            message=f"Done! Generated {len(generated)} clips.",
            clips=generated,
        )

    except Exception as exc:
        _update_job(job_id, status="error", progress=0, message=str(exc))

    finally:
        # Clean up extracted audio (save disk space)
        audio_path = os.path.join(jdir, "audio.mp3")
        if os.path.exists(audio_path):
            os.remove(audio_path)


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

@app.post("/api/upload")
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            400,
            f"Unsupported file type '{ext}'. Accepted: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    job_id = str(uuid.uuid4())
    jobs[job_id] = {
        "status": "uploading",
        "progress": 2,
        "message": "Saving uploaded video...",
        "clips": [],
    }

    # Save upload
    upload_path = os.path.join(config.UPLOAD_DIR, f"{job_id}{ext}")
    with open(upload_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    background_tasks.add_task(_process_video, job_id, upload_path)
    return {"job_id": job_id}


@app.get("/api/status/{job_id}")
async def get_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")
    job = jobs[job_id]
    return {
        "status": job["status"],
        "progress": job["progress"],
        "message": job["message"],
        "clips": job.get("clips", []),
    }


@app.get("/api/video/{job_id}/{clip_name}")
async def serve_clip(job_id: str, clip_name: str):
    # Basic path traversal guard
    if ".." in clip_name or "/" in clip_name:
        raise HTTPException(400, "Invalid clip name")
    clip_path = os.path.join(_job_dir(job_id), clip_name)
    if not os.path.exists(clip_path):
        raise HTTPException(404, "Clip not found")
    return FileResponse(clip_path, media_type="video/mp4")


@app.get("/api/download/{job_id}")
async def download_all(job_id: str):
    if job_id not in jobs or jobs[job_id]["status"] != "done":
        raise HTTPException(400, "Job not ready or does not exist")

    jdir = _job_dir(job_id)
    clip_files = sorted(Path(jdir).glob("clip_*.mp4"))

    if not clip_files:
        raise HTTPException(404, "No clips found for this job")

    def _generate_zip():
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for cf in clip_files:
                zf.write(cf, cf.name)
        buf.seek(0)
        yield buf.read()

    return StreamingResponse(
        _generate_zip(),
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="clips_{job_id[:8]}.zip"'
        },
    )


# ---------------------------------------------------------------------------
# Serve frontend (must be last — catches all unmatched routes)
# ---------------------------------------------------------------------------

app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
