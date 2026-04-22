"""
FastAPI application — AI Clipping Platform
Endpoints: upload, status, video streaming, ZIP download
"""

import io
import json
import os
import shutil
import subprocess
import uuid
import zipfile
import asyncio
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional

from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from . import config
from .clipper import Clip, build_clips, create_clip_video, _group_into_utterances, _words_to_segments
from .reframer import get_reframe_plan
from .transcriber import WordSegment, extract_audio, transcribe
from .scheduler import router as scheduler_router, scheduler_loop
from .jobstore import init_db, create_job, update_job as _store_update, get_job
from .clipstore import upsert_clip, get_subtitle_words, save_subtitle_state
from .storage import (
    upload_clip,
    upload_private_artifact,
    download_private_artifact,
    download_public_clip,
)

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    task = asyncio.create_task(scheduler_loop())
    yield
    task.cancel()

app = FastAPI(title="AI Clipping Platform", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(config.UPLOAD_DIR, exist_ok=True)
os.makedirs(config.OUTPUT_DIR, exist_ok=True)

app.include_router(scheduler_router)

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".mkv", ".webm"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _update_job(job_id: str, **kwargs):
    _store_update(job_id, **kwargs)


def _job_dir(job_id: str) -> str:
    return os.path.join(config.OUTPUT_DIR, job_id)


def _restore_clip_artifacts(job_id: str, clip_name: str) -> tuple[bool, bool]:
    jdir = _job_dir(job_id)
    raw_name = clip_name.replace(".mp4", "_raw.mp4")
    words_name = clip_name.replace(".mp4", "_words.json")
    raw_path = os.path.join(jdir, raw_name)
    words_path = os.path.join(jdir, words_name)

    raw_ok = os.path.exists(raw_path) or download_private_artifact(job_id, raw_name, raw_path)
    words_ok = os.path.exists(words_path) or download_private_artifact(job_id, words_name, words_path)
    return raw_ok, words_ok


def _clip_paths(job_id: str, clip_name: str) -> tuple[str, str, str, str]:
    jdir = _job_dir(job_id)
    raw_name = clip_name.replace(".mp4", "_raw.mp4")
    words_name = clip_name.replace(".mp4", "_words.json")
    return (
        os.path.join(jdir, raw_name),
        os.path.join(jdir, clip_name),
        os.path.join(jdir, words_name),
        jdir,
    )


def _load_words_json(words_path: str) -> list:
    with open(words_path, "r") as f:
        return json.load(f)


def _write_words_json(words_path: str, words: list) -> None:
    os.makedirs(os.path.dirname(words_path), exist_ok=True)
    with open(words_path, "w") as f:
        json.dump(words, f)


def _restore_words_from_db(job_id: str, clip_name: str, words_path: str) -> bool:
    words = get_subtitle_words(job_id, clip_name)
    if not words:
        return False
    _write_words_json(words_path, words)
    print(f"[SUPABASE] Restored subtitle words from DB: {job_id}/{clip_name}")
    return True


# ---------------------------------------------------------------------------
# Background processing pipeline
# ---------------------------------------------------------------------------

async def _process_single_video(
    job_id: str,
    video_path: str,
    jdir: str,
    clip_index_offset: int = 1,
    progress_base: int = 5,
    progress_end: int = 95,
    style_dict: Optional[dict] = None,
) -> list:
    """Transcribe and render one video. Returns list of clip dicts. Raises on failure."""
    audio_path = os.path.join(jdir, "audio.mp3")
    span = progress_end - progress_base
    try:
        # 1. Extract audio
        _update_job(job_id, status="extracting", progress=progress_base,
                    message=f"Extracting audio from {Path(video_path).name}...")
        await asyncio.to_thread(extract_audio, video_path, audio_path)

        # 2. Transcribe
        _update_job(job_id, status="transcribing",
                    progress=progress_base + int(span * 0.10),
                    message="Transcribing audio with Whisper... (this may take a few minutes for long videos)")
        lang = style_dict.get("language", "id") if style_dict else "id"
        whisper_prompt = style_dict.get("whisper_prompt", "") if style_dict else ""
        words = await asyncio.to_thread(transcribe, audio_path, lang, whisper_prompt or None)

        if not words:
            raise ValueError(
                f"No speech detected in '{Path(video_path).name}'. Please check the audio.")

        # Cache transcription so re-clipping skips Whisper next time
        import dataclasses
        trans_path = os.path.join(jdir, "transcription.json")
        with open(trans_path, "w") as tf:
            json.dump([dataclasses.asdict(w) for w in words], tf)
        await asyncio.to_thread(upload_private_artifact, job_id, "transcription.json", trans_path, "application/json")

        _update_job(job_id, progress=progress_base + int(span * 0.40),
                    message=f"Transcribed {len(words)} words. Analyzing scenes...")
        print(f"[PIPELINE] Transcribed {len(words)} words from {Path(video_path).name}")

        # 3. Group words into utterances, then compose story clips via LLM
        utterances = await asyncio.to_thread(_group_into_utterances, words)

        if not utterances:
            raise ValueError(
                f"No speech utterances found in '{Path(video_path).name}'. "
                "The video may be too short or mostly silence.")

        total_utt_speech = sum(u.duration for u in utterances)
        print(f"[PIPELINE] {len(utterances)} utterances | total speech: {total_utt_speech:.1f}s")

        _update_job(job_id, progress=progress_base + int(span * 0.44),
                    message=f"AI composing story clips from {len(utterances)} utterances...")
        from .llm import compose_story_clips, ensure_caption
        utt_data = [
            {"id": i, "text": u.text, "duration": round(u.duration, 2), "start": round(u.start, 1)}
            for i, u in enumerate(utterances)
            if u.duration > 0.3
        ]
        print(f"[PIPELINE] Sending {len(utt_data)} utterances to LLM (filtered >0.3s)")
        content_type = style_dict.get("content_type", "retail") if style_dict else "retail"
        composed_stories = await asyncio.to_thread(compose_story_clips, utt_data, content_type)
        print(f"[PIPELINE] LLM returned {len(composed_stories)} story candidates")
        for i, s in enumerate(composed_stories):
            ids = s.get("utterance_ids") or []
            speech = sum(utterances[j].duration for j in ids if j < len(utterances))
            print(f"  [{i+1}] {s.get('clip_type','?'):12s} | score={s.get('score','?')} | "
                  f"{len(ids)} utts | speech={speech:.1f}s")

        # Fallback to mechanical clipping if LLM composition fails
        if not composed_stories:
            _update_job(job_id, message="Story composition failed — falling back to scene detection...")
            raw_clips = await asyncio.to_thread(build_clips, words)
            composed_stories = [
                {"utterance_ids": None, "_clip": c, "score": None, "summary": ""}
                for c in raw_clips
            ]

        # Build Clip objects from each composed story
        _RENDER_CAP = config.MAX_CLIP_DURATION - 5.0  # 40s headroom for padding
        clips_with_meta = []
        print(f"[BUILD] Assembling {len(composed_stories)} stories into clip objects...")
        for story in composed_stories:
            if story.get("_clip"):
                clips_with_meta.append((story["_clip"], story))
                continue
            sel_ids = story.get("utterance_ids", [])
            sel_utts = [utterances[i] for i in sel_ids if i < len(utterances)]
            if len(sel_utts) < 2:
                print(f"  [SKIP] story {story.get('clip_type','?')} — only {len(sel_utts)} utterances resolved")
                continue
            # Hard cap: trim from the end until total speech ≤ _RENDER_CAP
            trimmed, total_speech = [], 0.0
            for u in sel_utts:
                if total_speech + u.duration > _RENDER_CAP:
                    break
                trimmed.append(u)
                total_speech += u.duration
            if len(trimmed) >= 1:
                sel_utts = trimmed
            else:
                sel_utts = sel_utts[:2]

            # Recalculate after trim
            total_speech = sum(u.duration for u in sel_utts)
            print(f"  [STORY] {story.get('clip_type','?'):12s} | score={story.get('score','?')} | "
                  f"{len(sel_utts)} utts | speech={total_speech:.1f}s")

            # AUTO-HARNESS: if speech < MIN_CLIP, expand with adjacent utterances
            if total_speech < config.MIN_CLIP_DURATION and sel_ids:
                valid_ids = [i for i in sel_ids if i < len(utterances)]
                if valid_ids:
                    min_idx, max_idx = min(valid_ids), max(valid_ids)
                    print(f"  [HARNESS] speech={total_speech:.1f}s < MIN={config.MIN_CLIP_DURATION}s — expanding...")
                    fwd = max_idx + 1
                    while total_speech < config.MIN_CLIP_DURATION and fwd < len(utterances):
                        u = utterances[fwd]
                        if u.duration > 0.3:
                            sel_utts.append(u)
                            total_speech += u.duration
                            print(f"  [HARNESS] +fwd[{fwd}] {u.duration:.1f}s → total={total_speech:.1f}s")
                        fwd += 1
                    if total_speech < config.MIN_CLIP_DURATION:
                        bwd = min_idx - 1
                        while total_speech < config.MIN_CLIP_DURATION and bwd >= 0:
                            u = utterances[bwd]
                            if u.duration > 0.3:
                                sel_utts.insert(0, u)
                                total_speech += u.duration
                                print(f"  [HARNESS] +bwd[{bwd}] {u.duration:.1f}s → total={total_speech:.1f}s")
                            bwd -= 1
                    # Deduplicate and sort chronologically
                    seen_ids = set()
                    deduped = []
                    for u in sel_utts:
                        uid = id(u)
                        if uid not in seen_ids:
                            seen_ids.add(uid)
                            deduped.append(u)
                    sel_utts = sorted(deduped, key=lambda u: u.start)
                    total_speech = sum(u.duration for u in sel_utts)
                    print(f"  [HARNESS] Final: {len(sel_utts)} utts | speech={total_speech:.1f}s")

            sel_utts = sorted(sel_utts, key=lambda u: u.start)
            all_words = [w for u in sel_utts for w in u.words]
            segments = _words_to_segments(all_words, config.WORD_GAP_THRESHOLD) if all_words else [(u.start, u.end) for u in sel_utts]
            clip = Clip(
                segments=segments,
                start=sel_utts[0].start,
                end=sel_utts[-1].end,
                transcript=" ".join(u.text for u in sel_utts),
                words=all_words,
                index=len(clips_with_meta) + 1,
            )

            # Hard cap on wall duration — clips spanning huge silences take forever to render
            MAX_WALL = 90.0
            if clip.wall_duration <= 0 or clip.speech_duration <= 0:
                print(f"  [SKIP] invalid clip timing | wall={clip.wall_duration:.1f}s | speech={clip.speech_duration:.1f}s")
                continue
            if clip.wall_duration > MAX_WALL:
                print(f"  [SKIP] wall={clip.wall_duration:.1f}s > {MAX_WALL}s cap — dropping")
                continue

            print(f"  [CLIP] #{len(clips_with_meta)+1} built | wall={clip.wall_duration:.1f}s | speech={clip.speech_duration:.1f}s")
            clips_with_meta.append((clip, story))

        print(f"[BUILD] {len(clips_with_meta)} clips ready for rendering")

        if not clips_with_meta:
            raise ValueError(
                f"AI could not compose any complete customer interaction clips from '{Path(video_path).name}'.")

        _update_job(job_id, progress=progress_base + int(span * 0.47),
                    message=f"Composed {len(clips_with_meta)} story clip(s). Detecting orientation...")

        # 3b. Detect orientation
        reframe_plan = await asyncio.to_thread(get_reframe_plan, video_path)
        if reframe_plan:
            _update_job(job_id,
                        message="Landscape video detected — auto-reframing to 9:16 with active-speaker centering...")

        _update_job(job_id, progress=progress_base + int(span * 0.50),
                    message=f"Rendering {len(clips_with_meta)} clip(s)...")

        # 4. Render each composed story clip
        generated = []
        source_name = Path(video_path).name
        for render_idx, (clip, story) in enumerate(clips_with_meta):
            global_index = clip_index_offset + render_idx
            clip_name = f"clip_{global_index:03d}.mp4"
            clip_path = os.path.join(jdir, clip_name)

            render_frac = 0.50 + 0.45 * (render_idx / len(clips_with_meta))
            _update_job(job_id, progress=progress_base + int(span * render_frac),
                        message=f"Rendering clip {render_idx + 1} of {len(clips_with_meta)}...")

            success = await asyncio.to_thread(
                create_clip_video, video_path, clip, clip_path, reframe_plan, style_dict
            )
            print(f"[RENDER] clip_{global_index:03d} create_clip_video={success} exists={os.path.exists(clip_path)} size={os.path.getsize(clip_path) if os.path.exists(clip_path) else 0}")

            if success:
                raw_path = clip_path.replace(".mp4", "_raw.mp4")
                words_path = clip_path.replace(".mp4", "_words.json")
                await asyncio.to_thread(upload_private_artifact, job_id, Path(raw_path).name, raw_path, "video/mp4")
                await asyncio.to_thread(upload_private_artifact, job_id, Path(words_path).name, words_path, "application/json")
                # Upload to Supabase Storage; fall back to Railway URL if unavailable
                supabase_url = await asyncio.to_thread(upload_clip, job_id, clip_name, clip_path)
                print(f"[RENDER] clip_{global_index:03d} upload_clip={supabase_url!r}")
                clip_url = supabase_url or f"/api/video/{job_id}/{clip_name}"

                clip_payload = {
                    "name": clip_name,
                    "index": global_index,
                    "transcript": clip.transcript,
                    "start": round(clip.start, 2),
                    "end": round(clip.end, 2),
                    "duration": round(clip.speech_duration, 1),
                    "url": clip_url,
                    "source": source_name,
                    "score": story.get("score"),
                    "score_summary": story.get("summary", ""),
                    "caption": ensure_caption(story.get("caption", ""), story.get("clip_type", ""), story.get("summary", "")),
                    "clip_type": story.get("clip_type", ""),
                    "score_metrics": {},
                }
                generated.append(clip_payload)
                subtitle_words = await asyncio.to_thread(_load_words_json, words_path)
                await asyncio.to_thread(upsert_clip, job_id, clip_payload, subtitle_words, style_dict or {})

        print(f"[RENDER] pipeline done — {len(generated)} clips in generated list")
        return generated

    finally:
        # Clean up extracted audio (save disk space)
        if os.path.exists(audio_path):
            os.remove(audio_path)


async def _process_video(
    job_id: str,
    video_path: str,
    style_dict: Optional[dict] = None,
    original_filename: str = "",
):
    jdir = _job_dir(job_id)
    os.makedirs(jdir, exist_ok=True)
    with open(os.path.join(jdir, "meta.json"), "w") as mf:
        json.dump({"video_path": video_path, "filename": original_filename}, mf)
    await asyncio.to_thread(upload_private_artifact, job_id, "meta.json", os.path.join(jdir, "meta.json"), "application/json")
    try:
        clips = await _process_single_video(job_id, video_path, jdir, style_dict=style_dict)
        if not clips:
            raise ValueError("No clips were successfully rendered.")
        _update_job(job_id, status="done", progress=100,
                    message=f"Done! Generated {len(clips)} clips.", clips=clips)
    except Exception as exc:
        _update_job(job_id, status="error", progress=0, message=str(exc))
    finally:
        if os.path.exists(video_path):
            os.remove(video_path)


def _get_video_duration_sync(video_path: str) -> float:
    """Return video duration in seconds via ffprobe."""
    result = subprocess.run(
        [config.FFPROBE_BIN, "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", video_path],
        capture_output=True, text=True,
    )
    try:
        return float(result.stdout.strip())
    except ValueError:
        return 0.0


def _find_source(t: float, sources: list) -> tuple:
    """Return (path, offset, duration, reframe_plan) for the source containing timestamp t."""
    for path, offset, duration, reframe_plan in sources:
        if offset <= t < offset + duration + 1.0:  # +1s tolerance at boundaries
            return path, offset, duration, reframe_plan
    return sources[-1]


def _localize_clip(clip: "Clip", src_offset: float, src_duration: float) -> "Clip":
    """Shift clip timestamps from the merged timeline back to source-video local time."""
    new_segs = []
    for s, e in clip.segments:
        ls = max(s - src_offset, 0.0)
        le = min(e - src_offset, src_duration)
        if le > ls:
            new_segs.append((ls, le))

    new_words = [
        WordSegment(w.word,
                    max(w.start - src_offset, 0.0),
                    min(w.end - src_offset, src_duration))
        for w in clip.words
        if 0.0 <= w.start - src_offset < src_duration
    ]

    return Clip(
        segments=new_segs,
        start=max(clip.start - src_offset, 0.0),
        end=min(clip.end - src_offset, src_duration),
        transcript=clip.transcript,
        words=new_words,
        index=clip.index,
    )


async def _process_videos_batch(job_id: str, video_paths: list, style_dict: Optional[dict] = None):
    """
    Batch processing without video concatenation:
      1. Transcribe each video with cumulative timestamp offsets
      2. Merge all words → run clipping algorithm once
      3. Render each clip from its original source video
    """
    jdir = _job_dir(job_id)
    os.makedirs(jdir, exist_ok=True)

    if len(video_paths) == 1:
        await _process_video(job_id, video_paths[0], style_dict=style_dict)
        return

    total = len(video_paths)
    sources: list = []   # (path, offset, duration, reframe_plan)
    all_words: list = []
    cumulative = 0.0

    try:
        lang = style_dict.get("language", "id") if style_dict else "id"
        whisper_prompt = style_dict.get("whisper_prompt", "") if style_dict else ""

        # ── Step 1: transcribe each video ────────────────────────
        for i, vpath in enumerate(video_paths):
            prog = 5 + int(35 * i / total)
            _update_job(job_id, status="transcribing", progress=prog,
                        message=f"Transcribing video {i + 1} of {total}: {Path(vpath).name}")

            audio_path = os.path.join(jdir, f"audio_{i}.mp3")
            try:
                await asyncio.to_thread(extract_audio, vpath, audio_path)
                words = await asyncio.to_thread(transcribe, audio_path, lang, whisper_prompt or None)
                duration = await asyncio.to_thread(_get_video_duration_sync, vpath)
                reframe_plan = await asyncio.to_thread(get_reframe_plan, vpath)
            finally:
                if os.path.exists(audio_path):
                    os.remove(audio_path)

            for w in words:
                w.start += cumulative
                w.end += cumulative

            all_words.extend(words)
            sources.append((vpath, cumulative, duration, reframe_plan))
            cumulative += duration

        if not all_words:
            _update_job(job_id, status="error", progress=0,
                        message="No speech detected in any of the uploaded videos.")
            return

        # ── Step 2: build utterances, send to LLM ────────────
        from .llm import generate_storytelling_script
        from .clipper import _group_into_utterances, Clip, create_multisource_clip_video
        
        _update_job(job_id, status="clipping", progress=42,
                    message=f"Generating AI storytelling script from {len(all_words)} words...")
                    
        utterances = await asyncio.to_thread(_group_into_utterances, all_words)
        
        utt_data = []
        for idx, u in enumerate(utterances):
            if u.duration > 0.3:
                utt_data.append({
                    "id": idx,
                    "text": u.text,
                    "duration": round(u.duration, 2)
                })
                
        selected_ids = await asyncio.to_thread(generate_storytelling_script, utt_data)
        
        if not selected_ids:
            _update_job(job_id, status="error", progress=0,
                        message="AI failed to generate a storytelling script from these videos.")
            return
            
        _update_job(job_id, status="clipping", progress=48,
                    message=f"AI selected {len(selected_ids)} segments. Building final clip...")
                    
        selected_utterances = [utterances[i] for i in selected_ids if i < len(utterances)]
        
        if not selected_utterances:
            _update_job(job_id, status="error", progress=0, message="No valid segments selected.")
            return
            
        segments = [(u.start, u.end) for u in selected_utterances]
        transcript = " ".join(u.text for u in selected_utterances)
        words_list = [w for u in selected_utterances for w in u.words]
        
        story_clip = Clip(
            segments=segments,
            start=selected_utterances[0].start,
            end=selected_utterances[-1].end,
            transcript=transcript,
            words=words_list,
            index=1
        )
        clips = [story_clip]

        # ── Step 3: render the storytelling clip across sources ─────
        _update_job(job_id, status="rendering", progress=50,
                    message=f"Compositing storytelling clip across {total} source videos...")
        generated = []

        for i, clip in enumerate(clips):
            clip_name = f"clip_{i + 1:03d}.mp4"
            clip_path = os.path.join(jdir, clip_name)

            render_frac = i / len(clips)
            _update_job(job_id, progress=50 + int(45 * render_frac),
                        message=f"Rendering clip...")

            success = await asyncio.to_thread(
                create_multisource_clip_video, sources, clip, clip_path, style_dict
            )

            if success:
                raw_path = clip_path.replace(".mp4", "_raw.mp4")
                words_path = clip_path.replace(".mp4", "_words.json")
                await asyncio.to_thread(upload_private_artifact, job_id, Path(raw_path).name, raw_path, "video/mp4")
                await asyncio.to_thread(upload_private_artifact, job_id, Path(words_path).name, words_path, "application/json")
                supabase_url = await asyncio.to_thread(upload_clip, job_id, clip_name, clip_path)
                clip_payload = {
                    "name": clip_name,
                    "index": i + 1,
                    "transcript": clip.transcript,
                    "start": round(clip.start, 2),
                    "end": round(clip.end, 2),
                    "duration": round(clip.speech_duration, 1),
                    "url": supabase_url or f"/api/video/{job_id}/{clip_name}",
                    "source": "AI Storyteller (Multiple clips)",
                }
                generated.append(clip_payload)
                subtitle_words = await asyncio.to_thread(_load_words_json, words_path)
                await asyncio.to_thread(upsert_clip, job_id, clip_payload, subtitle_words, style_dict or {})

        if not generated:
            _update_job(job_id, status="error", progress=0,
                        message="No clips were successfully rendered.")
        else:
            _update_job(job_id, status="done", progress=100,
                        message=f"Done! Generated storytelling clip from {total} videos.",
                        clips=generated)

    except Exception as exc:
        _update_job(job_id, status="error", progress=0, message=str(exc))
    finally:
        for vpath in video_paths:
            if os.path.exists(vpath):
                os.remove(vpath)


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

def _extract_user_id(request: Request) -> Optional[str]:
    """Extract Supabase user_id from the Bearer token, best-effort."""
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth[len("Bearer "):]
    try:
        from .supabase_client import get_client
        result = get_client().auth.get_user(token)
        return result.user.id if result.user else None
    except Exception:
        return None


@app.post("/api/upload")
async def upload_video(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    style: str = Form(None),
):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            400,
            f"Unsupported file type '{ext}'. Accepted: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    user_id = _extract_user_id(request)
    job_id = str(uuid.uuid4())
    original_filename = file.filename or f"{job_id}{ext}"

    # Save upload to disk (fast, local I/O)
    upload_path = os.path.join(config.UPLOAD_DIR, f"{job_id}{ext}")
    with open(upload_path, "wb") as out:
        shutil.copyfileobj(file.file, out)

    create_job(job_id, status="uploading", progress=2,
               message="Saving uploaded video...", logs=["Saving uploaded video..."],
               user_id=user_id, filename=original_filename)

    style_dict = json.loads(style) if style else {}
    background_tasks.add_task(_process_video, job_id, upload_path, style_dict, original_filename)
    return {"job_id": job_id}


@app.post("/api/upload-batch")
async def upload_batch(
    request: Request,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    style: str = Form(None),
):
    if not files:
        raise HTTPException(400, "No files provided")
    if len(files) > 20:
        raise HTTPException(400, "Maximum 20 files per batch")

    for f in files:
        ext = Path(f.filename or "").suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                400,
                f"Unsupported file type '{ext}' in '{f.filename}'. "
                f"Accepted: {', '.join(ALLOWED_EXTENSIONS)}",
            )

    user_id = _extract_user_id(request)
    job_id = str(uuid.uuid4())
    filenames = [f.filename or f"video_{i}" for i, f in enumerate(files)]
    msg = f"Saving {len(files)} video(s)..."
    create_job(job_id, status="uploading", progress=2, message=msg, logs=[msg],
               user_id=user_id, filename=", ".join(filenames))

    saved_paths = []
    for i, f in enumerate(files):
        ext = Path(f.filename or "").suffix.lower()
        upload_path = os.path.join(config.UPLOAD_DIR, f"{job_id}_{i}{ext}")
        with open(upload_path, "wb") as out:
            shutil.copyfileobj(f.file, out)
        saved_paths.append(upload_path)

    style_dict = json.loads(style) if style else {}
    background_tasks.add_task(_process_videos_batch, job_id, saved_paths, style_dict)
    return {"job_id": job_id}


@app.get("/api/status/{job_id}")
async def get_status(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return {
        "status": job["status"],
        "progress": job["progress"],
        "message": job["message"],
        "clips": job.get("clips", []),
        "logs": job.get("logs", []),
    }


@app.get("/api/thumbnail/{job_id}/{clip_name}")
async def serve_thumbnail(job_id: str, clip_name: str):
    if ".." in clip_name or "/" in clip_name:
        raise HTTPException(400, "Invalid clip name")
    clip_path = os.path.join(_job_dir(job_id), clip_name)
    if not os.path.exists(clip_path):
        raise HTTPException(404, "Clip not found")
    thumb_path = clip_path.replace(".mp4", "_thumb.jpg")
    if not os.path.exists(thumb_path):
        import subprocess as _sp
        result = _sp.run(
            ["ffmpeg", "-y", "-ss", "0", "-i", clip_path,
             "-vframes", "1", "-q:v", "4", "-vf", "scale=180:-1", thumb_path],
            capture_output=True,
        )
        if result.returncode != 0 or not os.path.exists(thumb_path):
            raise HTTPException(500, "Thumbnail generation failed")
    return FileResponse(thumb_path, media_type="image/jpeg")


@app.get("/api/video/{job_id}/{clip_name}")
async def serve_clip(job_id: str, clip_name: str):
    # Basic path traversal guard
    if ".." in clip_name or "/" in clip_name:
        raise HTTPException(400, "Invalid clip name")
    clip_path = os.path.join(_job_dir(job_id), clip_name)
    if not os.path.exists(clip_path):
        download_public_clip(job_id, clip_name, clip_path)
    if not os.path.exists(clip_path):
        raise HTTPException(404, "Clip not found")
    return FileResponse(clip_path, media_type="video/mp4")


@app.get("/api/download/{job_id}")
async def download_all(job_id: str):
    # Accept if job is done in-memory OR if the output directory exists on disk
    # (covers history entries after server restart)
    jdir = _job_dir(job_id)
    _job = get_job(job_id)
    db_done = _job is not None and _job["status"] == "done"
    on_disk = Path(jdir).is_dir()
    if not db_done and not on_disk:
        raise HTTPException(400, "Job not ready or does not exist")

    jdir = _job_dir(job_id)
    # Exclude _raw videos!
    clip_files = sorted(Path(jdir).glob("clip_*.mp4"))
    clip_files = [f for f in clip_files if not f.name.endswith("_raw.mp4")]

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

@app.delete("/api/jobs/{job_id}")
async def delete_job(job_id: str):
    """Delete a job and all its associated clips from DB and storage."""
    import shutil
    from .jobstore import _conn, _lock

    # 1. Remove local output folder
    jdir = _job_dir(job_id)
    if Path(jdir).is_dir():
        shutil.rmtree(jdir, ignore_errors=True)

    # 2. Remove from SQLite
    with _lock, _conn() as conn:
        conn.execute("DELETE FROM jobs WHERE job_id = ?", (job_id,))
        conn.commit()

    # 3. Remove from Supabase (best-effort, non-blocking)
    def _sb_delete():
        try:
            from .supabase_client import get_client
            from . import config as _cfg
            sb = get_client()
            sb.table("job_clips").delete().eq("job_id", job_id).execute()
            sb.table("jobs").delete().eq("job_id", job_id).execute()
            # Delete all storage objects under this job_id in both buckets
            for bucket in (_cfg.SUPABASE_CLIPS_BUCKET, _cfg.SUPABASE_UPLOADS_BUCKET):
                try:
                    items = sb.storage.from_(bucket).list(job_id)
                    if items:
                        paths = [f"{job_id}/{obj['name']}" for obj in items if obj.get("name")]
                        if paths:
                            sb.storage.from_(bucket).remove(paths)
                except Exception:
                    pass
            print(f"[DELETE] Job {job_id} removed from Supabase")
        except Exception as e:
            print(f"[DELETE] Supabase cleanup failed (non-fatal): {e}")

    import threading
    threading.Thread(target=_sb_delete, daemon=False).start()

    return {"deleted": job_id}


from pydantic import BaseModel

class WordOverride(BaseModel):
    word: str
    start: float
    end: float

class RenderSubtitlesRequest(BaseModel):
    font: str = "Poppins"
    primary_color: str = "&H00FFFFFF"
    bold: bool = True
    italic: bool = False
    text_case: str = "lowercase"
    font_size: float = 4.0
    letter_spacing: float = 0.0
    alignment: str = "center"
    has_outline: bool = False
    outline_color: str = "&H00000000"
    outline_width: int = 0
    shadow_size: int = 2
    shadow_x: float = 0.0
    shadow_y: float = 0.0
    shadow_color: str = "&H00000000"
    has_bg: bool = False
    bg_color: str = "&H00000000"
    bg_opacity: int = 60
    margin_v: float = 27.0
    language: str = "id"
    word_overrides: Optional[List[WordOverride]] = None

@app.get("/api/video-raw/{job_id}/{clip_name}")
async def serve_raw_clip(job_id: str, clip_name: str):
    if ".." in clip_name or "/" in clip_name:
        raise HTTPException(400, "Invalid clip name")
    clip_path = os.path.join(_job_dir(job_id), clip_name.replace(".mp4", "_raw.mp4"))
    if not os.path.exists(clip_path):
        raise HTTPException(404, "Raw clip not found")
    return FileResponse(clip_path, media_type="video/mp4")

@app.get("/api/words/{job_id}/{clip_name}")
async def get_words(job_id: str, clip_name: str):
    if ".." in clip_name or "/" in clip_name:
        raise HTTPException(400, "Invalid clip name")
    _, _, words_path, _ = _clip_paths(job_id, clip_name)
    if not os.path.exists(words_path):
        _restore_words_from_db(job_id, clip_name, words_path)
    if not os.path.exists(words_path):
        _restore_clip_artifacts(job_id, clip_name)
    if not os.path.exists(words_path):
        _restore_words_from_db(job_id, clip_name, words_path)
    if not os.path.exists(words_path):
        raise HTTPException(404, "Words file not found")
    return _load_words_json(words_path)


@app.post("/api/render-subtitles/{job_id}/{clip_name}")
async def render_subtitles(job_id: str, clip_name: str, req: RenderSubtitlesRequest):
    if ".." in clip_name or "/" in clip_name:
        raise HTTPException(400, "Invalid clip name")

    raw_path, out_path, words_path, _ = _clip_paths(job_id, clip_name)

    if not os.path.exists(words_path):
        _restore_words_from_db(job_id, clip_name, words_path)
    if not os.path.exists(raw_path) or not os.path.exists(words_path):
        _restore_clip_artifacts(job_id, clip_name)
    if not os.path.exists(words_path):
        _restore_words_from_db(job_id, clip_name, words_path)
    if not os.path.exists(raw_path) or not os.path.exists(words_path):
        raise HTTPException(404, "Required raw files missing")

    try:
        wdata = _load_words_json(words_path)

        # If word_overrides provided, replace word text while keeping original timestamps
        if req.word_overrides:
            overrides = {i: o.word for i, o in enumerate(req.word_overrides)}
            for i, w in enumerate(wdata):
                if i in overrides:
                    w["word"] = overrides[i]
            # Persist edited words so future re-applies keep the corrections
            _write_words_json(words_path, wdata)

        words = [WordSegment(**w) for w in wdata]

        ass_path = out_path.replace(".mp4", "_custom.ass")
        from .clipper import _generate_ass, _burn_ass

        style = req.model_dump(exclude={"word_overrides"})
        _generate_ass(words, ass_path, style=style)
        success = await asyncio.to_thread(_burn_ass, raw_path, ass_path, out_path)

        if os.path.exists(ass_path):
            os.remove(ass_path)

        if not success:
            raise HTTPException(500, "Failed to burn subtitles")

        await asyncio.to_thread(upload_private_artifact, job_id, Path(words_path).name, words_path, "application/json")
        public_url = await asyncio.to_thread(upload_clip, job_id, clip_name, out_path)
        transcript = " ".join((w.get("word") or "").strip() for w in wdata).strip()
        await asyncio.to_thread(
            save_subtitle_state,
            job_id,
            clip_name,
            wdata,
            req.model_dump(exclude={"word_overrides"}),
            public_url or f"/api/video/{job_id}/{clip_name}",
            transcript,
        )

        return {"success": True, "url": f"/api/video/{job_id}/{clip_name}"}
    except Exception as e:
        raise HTTPException(500, str(e))


# ---------------------------------------------------------------------------
# Reprocess: re-clip from cached transcription (skip upload + Whisper)
# ---------------------------------------------------------------------------

async def _reprocess_video(job_id: str, source_job_id: str, style_dict: Optional[dict] = None):
    """Re-clip an already-transcribed video using its cached transcription.json."""
    jdir = _job_dir(job_id)
    os.makedirs(jdir, exist_ok=True)
    try:
        source_jdir = _job_dir(source_job_id)
        meta_path = os.path.join(source_jdir, "meta.json")
        trans_path = os.path.join(source_jdir, "transcription.json")

        if not os.path.exists(meta_path):
            download_private_artifact(source_job_id, "meta.json", meta_path)
        if not os.path.exists(trans_path):
            download_private_artifact(source_job_id, "transcription.json", trans_path)

        if not os.path.exists(meta_path):
            raise ValueError("No metadata found for this job. Was it uploaded via single-video mode?")
        if not os.path.exists(trans_path):
            raise ValueError("No transcription cache found. Re-upload the video to generate one.")

        with open(meta_path) as f:
            meta = json.load(f)
        video_path = meta["video_path"]
        filename = meta.get("filename", Path(video_path).name)

        if not os.path.exists(video_path):
            raise ValueError(f"Original video file no longer exists: {filename}")

        with open(trans_path) as f:
            wdata = json.load(f)
        words = [WordSegment(**w) for w in wdata]

        _update_job(job_id, status="clipping", progress=30,
                    message=f"Loaded {len(words)} cached words from '{filename}'. Analyzing scenes...")

        utterances = await asyncio.to_thread(_group_into_utterances, words)
        if not utterances:
            raise ValueError("No speech utterances found in the cached transcription.")

        _update_job(job_id, status="clipping", progress=38,
                    message=f"AI composing story clips from {len(utterances)} utterances...")
        from .llm import compose_story_clips, ensure_caption
        utt_data = [
            {"id": i, "text": u.text, "duration": round(u.duration, 2), "start": round(u.start, 1)}
            for i, u in enumerate(utterances)
            if u.duration > 0.3
        ]
        content_type = style_dict.get("content_type", "retail") if style_dict else "retail"
        composed_stories = await asyncio.to_thread(compose_story_clips, utt_data, content_type)

        if not composed_stories:
            _update_job(job_id, message="Story composition failed — falling back to scene detection...")
            raw_clips = await asyncio.to_thread(build_clips, words)
            composed_stories = [
                {"utterance_ids": None, "_clip": c, "score": None, "summary": ""}
                for c in raw_clips
            ]

        _RENDER_CAP = config.MAX_CLIP_DURATION - 5.0  # 40s headroom for padding
        clips_with_meta = []
        print(f"[BUILD] Assembling {len(composed_stories)} stories into clip objects...")
        for story in composed_stories:
            if story.get("_clip"):
                clips_with_meta.append((story["_clip"], story))
                continue
            sel_ids = story.get("utterance_ids", [])
            sel_utts = [utterances[i] for i in sel_ids if i < len(utterances)]
            if len(sel_utts) < 2:
                print(f"  [SKIP] story {story.get('clip_type','?')} — only {len(sel_utts)} utterances resolved")
                continue
            trimmed, total_speech = [], 0.0
            for u in sel_utts:
                if total_speech + u.duration > _RENDER_CAP:
                    break
                trimmed.append(u)
                total_speech += u.duration
            if len(trimmed) >= 1:
                sel_utts = trimmed
            else:
                sel_utts = sel_utts[:2]

            total_speech = sum(u.duration for u in sel_utts)
            print(f"  [STORY] {story.get('clip_type','?'):12s} | score={story.get('score','?')} | "
                  f"{len(sel_utts)} utts | speech={total_speech:.1f}s")

            # AUTO-HARNESS: expand if speech < MIN_CLIP
            if total_speech < config.MIN_CLIP_DURATION and sel_ids:
                valid_ids = [i for i in sel_ids if i < len(utterances)]
                if valid_ids:
                    min_idx, max_idx = min(valid_ids), max(valid_ids)
                    print(f"  [HARNESS] speech={total_speech:.1f}s < MIN={config.MIN_CLIP_DURATION}s — expanding...")
                    fwd = max_idx + 1
                    while total_speech < config.MIN_CLIP_DURATION and fwd < len(utterances):
                        u = utterances[fwd]
                        if u.duration > 0.3:
                            sel_utts.append(u)
                            total_speech += u.duration
                            print(f"  [HARNESS] +fwd[{fwd}] {u.duration:.1f}s → total={total_speech:.1f}s")
                        fwd += 1
                    if total_speech < config.MIN_CLIP_DURATION:
                        bwd = min_idx - 1
                        while total_speech < config.MIN_CLIP_DURATION and bwd >= 0:
                            u = utterances[bwd]
                            if u.duration > 0.3:
                                sel_utts.insert(0, u)
                                total_speech += u.duration
                                print(f"  [HARNESS] +bwd[{bwd}] {u.duration:.1f}s → total={total_speech:.1f}s")
                            bwd -= 1
                    seen_ids = set()
                    deduped = []
                    for u in sel_utts:
                        uid = id(u)
                        if uid not in seen_ids:
                            seen_ids.add(uid)
                            deduped.append(u)
                    sel_utts = sorted(deduped, key=lambda u: u.start)
                    total_speech = sum(u.duration for u in sel_utts)
                    print(f"  [HARNESS] Final: {len(sel_utts)} utts | speech={total_speech:.1f}s")

            sel_utts = sorted(sel_utts, key=lambda u: u.start)
            all_words = [w for u in sel_utts for w in u.words]
            segments = _words_to_segments(all_words, config.WORD_GAP_THRESHOLD) if all_words else [(u.start, u.end) for u in sel_utts]
            clip = Clip(
                segments=segments,
                start=sel_utts[0].start,
                end=sel_utts[-1].end,
                transcript=" ".join(u.text for u in sel_utts),
                words=all_words,
                index=len(clips_with_meta) + 1,
            )
            if clip.wall_duration <= 0 or clip.speech_duration <= 0:
                print(f"  [SKIP] invalid clip timing | wall={clip.wall_duration:.1f}s | speech={clip.speech_duration:.1f}s")
                continue
            print(f"  [CLIP] #{len(clips_with_meta)+1} built | wall={clip.wall_duration:.1f}s | speech={clip.speech_duration:.1f}s")
            clips_with_meta.append((clip, story))

        print(f"[BUILD] {len(clips_with_meta)} clips ready for rendering")

        if not clips_with_meta:
            raise ValueError("AI could not compose any complete customer interaction clips.")

        _update_job(job_id, status="rendering", progress=45,
                    message=f"Composed {len(clips_with_meta)} story clip(s). Detecting orientation...")

        reframe_plan = await asyncio.to_thread(get_reframe_plan, video_path)
        if reframe_plan:
            _update_job(job_id, message="Landscape video detected — auto-reframing to 9:16 with active-speaker centering...")

        _update_job(job_id, progress=48, message=f"Rendering {len(clips_with_meta)} clip(s)...")

        generated = []
        for render_idx, (clip, story) in enumerate(clips_with_meta):
            clip_name = f"clip_{render_idx + 1:03d}.mp4"
            clip_path = os.path.join(jdir, clip_name)
            _update_job(job_id, progress=48 + int(47 * (render_idx / len(clips_with_meta))),
                        message=f"Rendering clip {render_idx + 1} of {len(clips_with_meta)}...")
            success = await asyncio.to_thread(
                create_clip_video, video_path, clip, clip_path, reframe_plan, style_dict
            )
            if success:
                raw_path = clip_path.replace(".mp4", "_raw.mp4")
                words_path = clip_path.replace(".mp4", "_words.json")
                await asyncio.to_thread(upload_private_artifact, job_id, Path(raw_path).name, raw_path, "video/mp4")
                await asyncio.to_thread(upload_private_artifact, job_id, Path(words_path).name, words_path, "application/json")
                supabase_url = await asyncio.to_thread(upload_clip, job_id, clip_name, clip_path)
                clip_payload = {
                    "name": clip_name,
                    "index": render_idx + 1,
                    "transcript": clip.transcript,
                    "start": round(clip.start, 2),
                    "end": round(clip.end, 2),
                    "duration": round(clip.speech_duration, 1),
                    "url": supabase_url or f"/api/video/{job_id}/{clip_name}",
                    "source": filename,
                    "score": story.get("score"),
                    "score_summary": story.get("summary", ""),
                    "caption": ensure_caption(story.get("caption", ""), story.get("clip_type", ""), story.get("summary", "")),
                    "score_metrics": {},
                }
                generated.append(clip_payload)
                subtitle_words = await asyncio.to_thread(_load_words_json, words_path)
                await asyncio.to_thread(upsert_clip, job_id, clip_payload, subtitle_words, style_dict or {})

        if not generated:
            raise ValueError("No clips were successfully rendered.")

        # Copy transcription cache to the new job dir too
        import shutil
        shutil.copy(trans_path, os.path.join(jdir, "transcription.json"))
        await asyncio.to_thread(upload_private_artifact, job_id, "transcription.json", os.path.join(jdir, "transcription.json"), "application/json")
        with open(os.path.join(jdir, "meta.json"), "w") as mf:
            json.dump({"video_path": video_path, "filename": filename}, mf)
        await asyncio.to_thread(upload_private_artifact, job_id, "meta.json", os.path.join(jdir, "meta.json"), "application/json")

        _update_job(job_id, status="done", progress=100,
                    message=f"Done! Re-generated {len(generated)} clips (cached transcription).",
                    clips=generated)
    except Exception as exc:
        _update_job(job_id, status="error", progress=0, message=str(exc))


@app.post("/api/reprocess/{source_job_id}")
async def reprocess_video(
    source_job_id: str,
    background_tasks: BackgroundTasks,
    style: str = Form(None),
):
    job_id = str(uuid.uuid4())
    create_job(job_id, status="clipping", progress=5,
               message="Loading cached transcription...", logs=["Loading cached transcription..."])
    style_dict = json.loads(style) if style else {}
    background_tasks.add_task(_reprocess_video, job_id, source_job_id, style_dict)
    return {"job_id": job_id}


# ---------------------------------------------------------------------------
# Serve frontend (must be last — catches all unmatched routes)
# ---------------------------------------------------------------------------

if os.path.isdir("frontend"):
    app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
