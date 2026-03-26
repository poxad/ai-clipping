"""
Core clipping algorithm: words → utterances → scenes → clips → FFmpeg video files.

Pipeline:
  1. Group words into utterances (gap > SILENCE_THRESHOLD)
  2. Group utterances into scenes (gap > SCENE_BREAK_THRESHOLD)
  3. Merge adjacent short scenes if combined duration ≤ MAX_CLIP
  4. Split long scenes (> MAX_CLIP) at utterance boundaries
  5. Discard clips with < MIN_VIABLE_SPEECH of actual speech
  6. Render each clip with FFmpeg, applying jump cuts (silence removed)
"""

import os
import subprocess
from dataclasses import dataclass, field
from typing import List, Tuple

from .transcriber import WordSegment
from . import config


# ---------------------------------------------------------------------------
# Data structures
# ---------------------------------------------------------------------------

@dataclass
class Utterance:
    words: List[WordSegment]
    start: float
    end: float

    @property
    def text(self) -> str:
        return " ".join(w.word for w in self.words)

    @property
    def duration(self) -> float:
        return self.end - self.start


@dataclass
class Scene:
    utterances: List[Utterance] = field(default_factory=list)

    @property
    def start(self) -> float:
        return self.utterances[0].start

    @property
    def end(self) -> float:
        return self.utterances[-1].end

    @property
    def wall_duration(self) -> float:
        """Total wall-clock span (includes silence between utterances)."""
        return self.end - self.start

    @property
    def speech_duration(self) -> float:
        """Total time where someone is actually speaking."""
        return sum(u.duration for u in self.utterances)


@dataclass
class Clip:
    segments: List[Tuple[float, float]]  # (start, end) speech segments
    start: float
    end: float
    transcript: str
    index: int = 0

    @property
    def wall_duration(self) -> float:
        return self.end - self.start

    @property
    def speech_duration(self) -> float:
        return sum(e - s for s, e in self.segments)


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def build_clips(words: List[WordSegment]) -> List[Clip]:
    utterances = _group_into_utterances(words)
    scenes = _group_into_scenes(utterances)
    scenes = _merge_short_scenes(scenes)

    clips: List[Clip] = []
    for scene in scenes:
        clips.extend(_scene_to_clips(scene))

    for i, clip in enumerate(clips):
        clip.index = i + 1

    return clips


# ---------------------------------------------------------------------------
# Step 1 — Words → Utterances
# ---------------------------------------------------------------------------

def _group_into_utterances(words: List[WordSegment]) -> List[Utterance]:
    if not words:
        return []

    groups: List[List[WordSegment]] = [[words[0]]]

    for word in words[1:]:
        gap = word.start - groups[-1][-1].end
        current_dur = word.end - groups[-1][0].start
        
        if gap > config.SILENCE_THRESHOLD or current_dur > config.MAX_CLIP_DURATION * 0.9:
            groups.append([word])
        else:
            groups[-1].append(word)

    return [
        Utterance(words=g, start=g[0].start, end=g[-1].end)
        for g in groups
    ]


# ---------------------------------------------------------------------------
# Step 2 — Utterances → Scenes
# ---------------------------------------------------------------------------

def _group_into_scenes(utterances: List[Utterance]) -> List[Scene]:
    if not utterances:
        return []

    scenes: List[Scene] = [Scene(utterances=[utterances[0]])]

    for utt in utterances[1:]:
        gap = utt.start - scenes[-1].utterances[-1].end
        if gap > config.SCENE_BREAK_THRESHOLD:
            scenes.append(Scene(utterances=[utt]))
        else:
            scenes[-1].utterances.append(utt)

    return scenes


# ---------------------------------------------------------------------------
# Step 3 — Merge short adjacent scenes
# ---------------------------------------------------------------------------

def _merge_short_scenes(scenes: List[Scene]) -> List[Scene]:
    """
    If two consecutive scenes are each shorter than MIN_CLIP and their
    combined wall duration is within MAX_CLIP, merge them into one.
    """
    if not scenes:
        return []

    merged: List[Scene] = [scenes[0]]

    for scene in scenes[1:]:
        prev = merged[-1]
        combined_wall = scene.end - prev.start  # includes gap between them

        both_short = (
            prev.wall_duration < config.MIN_CLIP_DURATION
            and scene.wall_duration < config.MIN_CLIP_DURATION
        )

        if both_short and combined_wall <= config.MAX_CLIP_DURATION:
            merged[-1] = Scene(utterances=prev.utterances + scene.utterances)
        else:
            merged.append(scene)

    return merged


# ---------------------------------------------------------------------------
# Step 4 — Scene → Clip(s)
# ---------------------------------------------------------------------------

def _scene_to_clips(scene: Scene) -> List[Clip]:
    if scene.speech_duration < config.MIN_VIABLE_SPEECH:
        return []

    if scene.wall_duration <= config.MAX_CLIP_DURATION:
        return [_utterances_to_clip(scene.utterances)]

    return _split_scene(scene)


def _split_scene(scene: Scene) -> List[Clip]:
    """Split a long scene into multiple clips at utterance boundaries."""
    clips: List[Clip] = []
    current: List[Utterance] = []

    for utt in scene.utterances:
        if current:
            proposed_wall = utt.end - current[0].start
            if proposed_wall > config.MAX_CLIP_DURATION:
                speech_dur = sum(u.duration for u in current)
                if speech_dur >= config.MIN_VIABLE_SPEECH:
                    clips.append(_utterances_to_clip(current))
                current = []
        
        current.append(utt)

    # Remaining utterances
    if current:
        speech_dur = sum(u.duration for u in current)
        if speech_dur >= config.MIN_VIABLE_SPEECH:
            clips.append(_utterances_to_clip(current))

    return clips


def _utterances_to_clip(utterances: List[Utterance]) -> Clip:
    segments = [(u.start, u.end) for u in utterances]
    transcript = " ".join(u.text for u in utterances)
    return Clip(
        segments=segments,
        start=utterances[0].start,
        end=utterances[-1].end,
        transcript=transcript,
    )


# ---------------------------------------------------------------------------
# Step 5 — Render clip with FFmpeg (jump cuts)
# ---------------------------------------------------------------------------

def create_clip_video(input_video: str, clip: Clip, output_path: str) -> bool:
    """
    Render a clip to output_path.
    Applies jump cuts: only speech segments are included (silences removed).
    Uses FFmpeg filter_complex concat when there are multiple segments.
    """
    padding = config.JUMP_CUT_PADDING
    padded = [
        (max(0.0, s - padding), e + padding)
        for s, e in clip.segments
    ]
    merged = _merge_segments(padded)

    if not merged:
        return False

    try:
        if len(merged) == 1:
            _ffmpeg_trim(input_video, merged[0][0], merged[0][1], output_path)
        else:
            _ffmpeg_concat(input_video, merged, output_path)
    except RuntimeError:
        return False

    return os.path.exists(output_path) and os.path.getsize(output_path) > 0


def _merge_segments(segments: List[Tuple[float, float]]) -> List[Tuple[float, float]]:
    if not segments:
        return []
    sorted_segs = sorted(segments, key=lambda x: x[0])
    merged = [list(sorted_segs[0])]
    for start, end in sorted_segs[1:]:
        if start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return [tuple(s) for s in merged]


_FFMPEG_ENCODE = ["-c:v", "libx264", "-c:a", "aac", "-preset", "fast", "-crf", "23"]


def _ffmpeg_trim(input_video: str, start: float, end: float, output_path: str):
    cmd = [
        config.FFMPEG_BIN, "-y",
        "-ss", f"{start:.3f}",
        "-to", f"{end:.3f}",
        "-i", input_video,
        *_FFMPEG_ENCODE,
        output_path,
    ]
    _run_ffmpeg(cmd)


def _ffmpeg_concat(input_video: str, segments: List[Tuple[float, float]], output_path: str):
    """Build filter_complex to concat multiple video+audio segments."""
    filter_parts = []
    for i, (start, end) in enumerate(segments):
        filter_parts.append(
            f"[0:v]trim=start={start:.3f}:end={end:.3f},setpts=PTS-STARTPTS[v{i}]"
        )
        filter_parts.append(
            f"[0:a]atrim=start={start:.3f}:end={end:.3f},asetpts=PTS-STARTPTS[a{i}]"
        )

    n = len(segments)
    concat_in = "".join(f"[v{i}][a{i}]" for i in range(n))
    filter_parts.append(f"{concat_in}concat=n={n}:v=1:a=1[outv][outa]")

    cmd = [
        config.FFMPEG_BIN, "-y",
        "-i", input_video,
        "-filter_complex", ";".join(filter_parts),
        "-map", "[outv]",
        "-map", "[outa]",
        *_FFMPEG_ENCODE,
        output_path,
    ]
    _run_ffmpeg(cmd)


def _run_ffmpeg(cmd: List[str]):
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg error:\n{result.stderr[-2000:]}")
