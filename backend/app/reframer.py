"""
Auto-reframe landscape (16:9) video to portrait (9:16) using face detection.

Pipeline:
  1. Detect video dimensions via FFmpeg
  2. If landscape (w > h): sample frames every 3s, run MediaPipe face detection
  3. Compute median face X position → derive crop offset
  4. Return FFmpeg crop filter string to be used during rendering
  5. If already portrait: return None (no crop needed)
"""

import re
import subprocess
from typing import Optional, Tuple

try:
    import cv2
    import mediapipe as mp
    import numpy as np
    _CV2_AVAILABLE = True
except ImportError:
    _CV2_AVAILABLE = False

from . import config


def get_video_dimensions(video_path: str) -> Tuple[int, int]:
    """Return (width, height) of video using FFmpeg."""
    result = subprocess.run(
        [config.FFMPEG_BIN, "-i", video_path],
        capture_output=True,
        text=True,
    )
    # Match resolutions like 1920x1080, filter out tiny numbers (sample rate etc.)
    matches = re.findall(r"(\d{3,5})x(\d{3,5})", result.stderr)
    if matches:
        w, h = int(matches[0][0]), int(matches[0][1])
        return w, h
    raise RuntimeError(f"Could not detect video dimensions for: {video_path}")


def get_portrait_crop_filter(video_path: str) -> Optional[str]:
    """
    Return an FFmpeg crop filter string if video is landscape, else None.

    For landscape input (w > h):
      - Detects face X center across sampled frames
      - Returns: "crop=CROP_W:H:CROP_X:0"

    For portrait input (w <= h):
      - Returns None (no reframing needed)
    """
    w, h = get_video_dimensions(video_path)

    if w <= h:
        return None  # Already portrait or square

    crop_w = int(h * 9 / 16)
    face_x_norm = _detect_face_center_x(video_path, w, h)

    face_px = int(face_x_norm * w)
    crop_x = max(0, min(face_px - crop_w // 2, w - crop_w))

    return f"crop={crop_w}:{h}:{crop_x}:0"


def _detect_face_center_x(video_path: str, width: int, height: int) -> float:
    """
    Sample frames every 3 seconds and return the median normalized X center
    of detected faces (0.0 = left, 1.0 = right).

    Falls back to 0.5 (center crop) if no faces are found or mediapipe unavailable.
    """
    if not _CV2_AVAILABLE:
        return 0.5  # cv2/mediapipe not available — fall back to center crop

    if not hasattr(mp, "solutions"):
        return 0.5  # mediapipe >= 0.10.14 removed solutions API

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

    # Sample every 3 seconds, stop after 60 samples (~3 min of data)
    # Customer service staff positions are stable — 3 min is more than enough
    sample_interval = max(1, int(fps * 3))
    max_samples = 60

    face_x_positions = []
    frame_idx = 0
    samples_taken = 0

    # model_selection=0 is optimized for faces within 2m (close range, good for store videos)
    with mp.solutions.face_detection.FaceDetection(
        min_detection_confidence=0.5, model_selection=0
    ) as detector:
        while cap.isOpened() and samples_taken < max_samples:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_idx % sample_interval == 0:
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = detector.process(rgb)

                if results.detections:
                    # Use the most confident detection if multiple faces
                    best = max(results.detections, key=lambda d: d.score[0])
                    bbox = best.location_data.relative_bounding_box
                    center_x = bbox.xmin + bbox.width / 2
                    # Clamp to [0, 1] — bbox can occasionally go slightly out of bounds
                    face_x_positions.append(max(0.0, min(1.0, center_x)))

                samples_taken += 1

            frame_idx += 1

    cap.release()

    if face_x_positions:
        median_x = float(np.median(face_x_positions))
        return median_x

    # No face detected — fall back to center crop
    return 0.5
