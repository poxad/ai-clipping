"""
Active-speaker reframing for landscape video rendered to portrait.

Pipeline:
  1. Detect video dimensions and return None for portrait/square sources
  2. Sample frames across the source video
  3. Detect faces and assign lightweight temporal tracks
  4. Estimate active speaker via mouth-motion activity per track
  5. Smooth the resulting crop targets into a time-indexed reframe plan
"""

from __future__ import annotations

import re
import subprocess
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

try:
    import cv2
    import mediapipe as mp
    import numpy as np
    _CV2_AVAILABLE = True
except ImportError:
    _CV2_AVAILABLE = False

from . import config


@dataclass
class ReframeSample:
    time: float
    crop_x: float
    confidence: float
    face_count: int


@dataclass
class ReframePlan:
    src_width: int
    src_height: int
    crop_width: int
    crop_height: int
    default_crop_x: float
    samples: List[ReframeSample]


def get_video_dimensions(video_path: str) -> Tuple[int, int]:
    """Return (width, height) of video using ffmpeg stderr."""
    result = subprocess.run(
        [config.FFMPEG_BIN, "-i", video_path],
        capture_output=True,
        text=True,
    )
    matches = re.findall(r"(\d{3,5})x(\d{3,5})", result.stderr)
    if matches:
        w, h = int(matches[0][0]), int(matches[0][1])
        return w, h
    raise RuntimeError(f"Could not detect video dimensions for: {video_path}")


def get_reframe_plan(video_path: str) -> Optional[ReframePlan]:
    """
    Return a time-indexed reframe plan for landscape video, else None.

    The plan always falls back to a stable center crop when visual analysis is
    unavailable or no useful faces can be found.
    """
    width, height = get_video_dimensions(video_path)
    if width <= height:
        return None

    crop_width = int(height * 9 / 16)
    default_crop_x = float(max(0, (width - crop_width) / 2))

    if not _CV2_AVAILABLE or not hasattr(mp, "solutions"):
        return ReframePlan(
            src_width=width,
            src_height=height,
            crop_width=crop_width,
            crop_height=height,
            default_crop_x=default_crop_x,
            samples=[
                ReframeSample(time=0.0, crop_x=default_crop_x, confidence=0.0, face_count=0),
            ],
        )

    samples = _analyze_landscape_video(video_path, width, height, crop_width, default_crop_x)
    if not samples:
        samples = [ReframeSample(time=0.0, crop_x=default_crop_x, confidence=0.0, face_count=0)]

    return ReframePlan(
        src_width=width,
        src_height=height,
        crop_width=crop_width,
        crop_height=height,
        default_crop_x=default_crop_x,
        samples=samples,
    )


def _analyze_landscape_video(
    video_path: str,
    width: int,
    height: int,
    crop_width: int,
    default_crop_x: float,
) -> List[ReframeSample]:
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0.0
    duration = frame_count / fps if frame_count > 0 else 0.0

    target_sample_sec = 0.25
    max_samples = 900
    if duration > 0 and duration / target_sample_sec > max_samples:
        target_sample_sec = max(target_sample_sec, duration / max_samples)
    sample_interval = max(1, int(round(fps * target_sample_sec)))

    tracks: Dict[int, dict] = {}
    next_track_id = 1
    active_track_id: Optional[int] = None
    observations: List[ReframeSample] = []
    frame_idx = 0

    with mp.solutions.face_detection.FaceDetection(
        min_detection_confidence=0.5,
        model_selection=0,
    ) as detector:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % sample_interval != 0:
                frame_idx += 1
                continue

            time_sec = frame_idx / fps
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = detector.process(rgb)
            detections = _extract_faces(results, width, height)
            assigned, next_track_id = _assign_tracks(detections, tracks, gray, time_sec, next_track_id)
            crop_x, confidence, active_track_id = _choose_crop_target(
                assigned,
                tracks,
                active_track_id,
                width,
                crop_width,
                default_crop_x,
            )
            observations.append(
                ReframeSample(
                    time=time_sec,
                    crop_x=crop_x,
                    confidence=confidence,
                    face_count=len(assigned),
                )
            )
            _decay_old_tracks(tracks, time_sec)
            frame_idx += 1

    cap.release()
    return _smooth_samples(observations, default_crop_x, width, crop_width)


def _extract_faces(results, width: int, height: int) -> List[dict]:
    if not results or not results.detections:
        return []

    faces: List[dict] = []
    for det in results.detections:
        bbox = det.location_data.relative_bounding_box
        x0 = max(0, int(bbox.xmin * width))
        y0 = max(0, int(bbox.ymin * height))
        x1 = min(width, int((bbox.xmin + bbox.width) * width))
        y1 = min(height, int((bbox.ymin + bbox.height) * height))
        if x1 <= x0 or y1 <= y0:
            continue

        center_x = (x0 + x1) / 2 / width
        area = (x1 - x0) * (y1 - y0)
        faces.append(
            {
                "bbox": (x0, y0, x1, y1),
                "center_x": center_x,
                "area": area,
                "score": float(det.score[0]) if det.score else 0.0,
            }
        )
    return faces


def _assign_tracks(
    detections: List[dict],
    tracks: Dict[int, dict],
    gray_frame,
    time_sec: float,
    next_track_id: int,
) -> Tuple[List[dict], int]:
    available = {
        track_id: track
        for track_id, track in tracks.items()
        if time_sec - track["last_seen"] <= 1.0
    }
    used_tracks = set()
    assigned: List[dict] = []

    for det in detections:
        best_track_id = None
        best_score = 999.0
        center_x = det["center_x"]
        area = det["area"]

        for track_id, track in available.items():
            if track_id in used_tracks:
                continue
            score = abs(center_x - track["center_x"]) + 0.35 * abs(_safe_area_ratio(area, track["area"]) - 1.0)
            if score < best_score:
                best_score = score
                best_track_id = track_id

        if best_track_id is not None and best_score < 0.22:
            track_id = best_track_id
            track = tracks[track_id]
        else:
            track_id = next_track_id
            next_track_id += 1
            track = {
                "center_x": center_x,
                "area": area,
                "last_seen": time_sec,
                "motion_ema": 0.0,
                "mouth_roi": None,
            }
            tracks[track_id] = track

        mouth_roi = _extract_mouth_roi(gray_frame, det["bbox"])
        motion = _estimate_mouth_motion(track.get("mouth_roi"), mouth_roi)
        track["center_x"] = center_x
        track["area"] = area
        track["last_seen"] = time_sec
        track["mouth_roi"] = mouth_roi
        track["motion_ema"] = 0.65 * track.get("motion_ema", 0.0) + 0.35 * motion
        used_tracks.add(track_id)

        assigned.append(
            {
                **det,
                "track_id": track_id,
                "motion": track["motion_ema"],
            }
        )

    return assigned, next_track_id


def _extract_mouth_roi(gray_frame, bbox: Tuple[int, int, int, int]):
    x0, y0, x1, y1 = bbox
    w = x1 - x0
    h = y1 - y0
    if w < 8 or h < 8:
        return None

    mx0 = x0 + int(w * 0.2)
    mx1 = x1 - int(w * 0.2)
    my0 = y0 + int(h * 0.58)
    my1 = y0 + int(h * 0.9)
    if mx1 <= mx0 or my1 <= my0:
        return None

    roi = gray_frame[my0:my1, mx0:mx1]
    if roi.size == 0:
        return None
    return cv2.resize(roi, (32, 16))


def _estimate_mouth_motion(prev_roi, curr_roi) -> float:
    if prev_roi is None or curr_roi is None:
        return 0.0
    diff = cv2.absdiff(prev_roi, curr_roi)
    score = float(diff.mean()) / 255.0
    return max(0.0, min(1.0, score * 3.0))


def _choose_crop_target(
    assigned: List[dict],
    tracks: Dict[int, dict],
    prev_active_track_id: Optional[int],
    width: int,
    crop_width: int,
    default_crop_x: float,
) -> Tuple[float, float, Optional[int]]:
    if not assigned:
        return default_crop_x, 0.0, None

    weighted_face_center = sum(face["center_x"] * face["area"] for face in assigned) / max(
        1.0, sum(face["area"] for face in assigned)
    )
    weighted_crop = _center_to_crop_x(weighted_face_center, width, crop_width)

    best_face = None
    best_score = -1.0
    second_score = -1.0
    for face in assigned:
        size_score = min(0.35, face["area"] / max(1.0, width * crop_width * 0.18))
        continuity_bonus = 0.10 if face["track_id"] == prev_active_track_id else 0.0
        score = face["motion"] + size_score + continuity_bonus
        if score > best_score:
            second_score = best_score
            best_score = score
            best_face = face
        elif score > second_score:
            second_score = score

    assert best_face is not None
    confidence = max(0.0, min(1.0, best_face["motion"] * 1.7 + max(0.0, best_score - max(second_score, 0.0))))
    if confidence < 0.18:
        fallback_crops = [
            _subject_crop_x(face["bbox"], width, crop_width)
            for face in assigned
        ]
        weighted_subject_crop = sum(crop * face["area"] for crop, face in zip(fallback_crops, assigned)) / max(
            1.0, sum(face["area"] for face in assigned)
        )
        return weighted_subject_crop, confidence, best_face["track_id"]

    speaker_crop = _subject_crop_x(best_face["bbox"], width, crop_width)
    return speaker_crop, confidence, best_face["track_id"]


def _smooth_samples(
    samples: List[ReframeSample],
    default_crop_x: float,
    width: int,
    crop_width: int,
) -> List[ReframeSample]:
    if not samples:
        return []

    smoothed: List[ReframeSample] = []
    prev_x = samples[0].crop_x if samples else default_crop_x
    prev_t = samples[0].time if samples else 0.0
    max_crop_x = max(0.0, width - crop_width)

    for idx, sample in enumerate(samples):
        if idx == 0:
            x = max(0.0, min(max_crop_x, sample.crop_x))
        else:
            dt = max(0.001, sample.time - prev_t)
            max_speed = crop_width * 0.38
            limited_delta = max(-max_speed * dt, min(max_speed * dt, sample.crop_x - prev_x))
            if abs(limited_delta) < 10.0:
                limited_delta = 0.0
            alpha = 0.14 + sample.confidence * 0.18
            x = prev_x + limited_delta * alpha
            x = max(0.0, min(max_crop_x, x))

        smoothed.append(
            ReframeSample(
                time=sample.time,
                crop_x=x,
                confidence=sample.confidence,
                face_count=sample.face_count,
            )
        )
        prev_x = x
        prev_t = sample.time

    if smoothed[0].time > 0.0:
        smoothed.insert(
            0,
            ReframeSample(
                time=0.0,
                crop_x=smoothed[0].crop_x,
                confidence=smoothed[0].confidence,
                face_count=smoothed[0].face_count,
            ),
        )

    return smoothed


def _center_to_crop_x(center_x_norm: float, width: int, crop_width: int) -> float:
    face_px = center_x_norm * width
    return float(max(0, min(face_px - crop_width / 2, width - crop_width)))


def _subject_crop_x(bbox: Tuple[int, int, int, int], width: int, crop_width: int) -> float:
    x0, _, x1, _ = bbox
    face_w = max(1.0, float(x1 - x0))

    # Approximate an upper-body framing zone from the detected face so the
    # crop keeps more of the speaker than just a centered face.
    subject_left = max(0.0, x0 - face_w * 1.15)
    subject_right = min(float(width), x1 + face_w * 1.15)
    safe_margin = crop_width * 0.08

    min_crop_x = max(0.0, subject_right + safe_margin - crop_width)
    max_crop_x = min(float(width - crop_width), subject_left - safe_margin)

    if min_crop_x <= max_crop_x:
        return (min_crop_x + max_crop_x) / 2.0

    subject_center = (subject_left + subject_right) / 2.0
    return float(max(0.0, min(float(width - crop_width), subject_center - crop_width / 2.0)))


def _safe_area_ratio(a: float, b: float) -> float:
    if a <= 0 or b <= 0:
        return 1.0
    return a / b


def _decay_old_tracks(tracks: Dict[int, dict], now: float) -> None:
    to_delete = []
    for track_id, track in tracks.items():
        if now - track["last_seen"] > 2.5:
            to_delete.append(track_id)
    for track_id in to_delete:
        del tracks[track_id]
