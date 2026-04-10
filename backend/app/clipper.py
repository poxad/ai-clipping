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
import re
import subprocess
from dataclasses import dataclass, field
from typing import List, Optional, Tuple

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
    words: List[WordSegment] = field(default_factory=list)
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

def _est_rendered(scene: Scene) -> float:
    """Estimated clip duration after jump cuts: speech time + padding per utterance."""
    return scene.speech_duration + len(scene.utterances) * 2 * config.JUMP_CUT_PADDING


def _merge_short_scenes(scenes: List[Scene]) -> List[Scene]:
    """
    Merge adjacent scenes where either scene wouldn't produce a viable (≥15s) clip,
    as long as the combined wall-clock span stays within MAX_CLIP.
    """
    if not scenes:
        return []

    merged: List[Scene] = [scenes[0]]

    for scene in scenes[1:]:
        prev = merged[-1]
        combined_wall = scene.end - prev.start  # includes gap between them

        either_too_short = (
            _est_rendered(prev) < config.MIN_CLIP_DURATION
            or _est_rendered(scene) < config.MIN_CLIP_DURATION
        )

        if either_too_short and combined_wall <= config.MAX_CLIP_DURATION:
            merged[-1] = Scene(utterances=prev.utterances + scene.utterances)
        else:
            merged.append(scene)

    return merged


# ---------------------------------------------------------------------------
# Step 4 — Scene → Clip(s)
# ---------------------------------------------------------------------------

def _scene_to_clips(scene: Scene) -> List[Clip]:
    if _est_rendered(scene) < config.MIN_CLIP_DURATION:
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
                tmp = Scene(utterances=current)
                if _est_rendered(tmp) >= config.MIN_CLIP_DURATION:
                    clips.append(_utterances_to_clip(current))
                current = []

        current.append(utt)

    # Remaining utterances
    if current:
        tmp = Scene(utterances=current)
        if _est_rendered(tmp) >= config.MIN_CLIP_DURATION:
            clips.append(_utterances_to_clip(current))

    return clips


def _words_to_segments(words: List[WordSegment], gap: float) -> List[Tuple[float, float]]:
    """Group word timestamps into speech segments, cutting silences > gap seconds."""
    if not words:
        return []
    groups: List[List[WordSegment]] = [[words[0]]]
    for w in words[1:]:
        if w.start - groups[-1][-1].end > gap:
            groups.append([w])
        else:
            groups[-1].append(w)
    return [(g[0].start, g[-1].end) for g in groups]


def _utterances_to_clip(utterances: List[Utterance]) -> Clip:
    all_words = [w for u in utterances for w in u.words]
    # Use word-level segments to aggressively cut any silence > WORD_GAP_THRESHOLD
    if all_words:
        segments = _words_to_segments(all_words, config.WORD_GAP_THRESHOLD)
    else:
        segments = [(u.start, u.end) for u in utterances]
    transcript = " ".join(u.text for u in utterances)
    return Clip(
        segments=segments,
        start=utterances[0].start,
        end=utterances[-1].end,
        transcript=transcript,
        words=all_words,
    )


# ---------------------------------------------------------------------------
# Step 5 — Render clip with FFmpeg (jump cuts)
# ---------------------------------------------------------------------------

def create_clip_video(
    input_video: str,
    clip: Clip,
    output_path: str,
    crop_filter: Optional[str] = None,
    style: Optional[dict] = None,
) -> bool:
    """
    Render a clip to output_path with jump cuts and burned-in subtitles.

    crop_filter: optional FFmpeg crop expression e.g. "crop=607:1080:400:0"
                 applied when input is landscape and needs reframing to 9:16.
    """
    padding = config.JUMP_CUT_PADDING
    trailing_pad = 0.4  # extra breathing room at the end so clip doesn't feel cut off
    padded = [
        (max(0.0, s - padding), e + padding)
        for s, e in clip.segments
    ]
    # Give the last segment extra trailing space so the clip ends naturally
    if padded:
        padded[-1] = (padded[-1][0], padded[-1][1] + trailing_pad)
    merged = _merge_segments(padded)

    if not merged:
        return False

    # Render jump-cut clip to a temp file first
    tmp_path = output_path.replace(".mp4", "_raw.mp4")
    try:
        try:
            if len(merged) == 1:
                _ffmpeg_trim(input_video, merged[0][0], merged[0][1], tmp_path, crop_filter)
            else:
                _ffmpeg_concat(input_video, merged, tmp_path, crop_filter)
        except RuntimeError as e:
            print(f"[CLIPPER] FFmpeg render failed for {os.path.basename(output_path)}: {e}")
            return False

        if not os.path.exists(tmp_path) or os.path.getsize(tmp_path) == 0:
            return False

        # Burn subtitles if word data is available
        if clip.words:
            ass_path = output_path.replace(".mp4", ".ass")
            try:
                remapped = _remap_words(clip.words, clip.segments)
                if remapped:
                    import json, dataclasses
                    with open(output_path.replace(".mp4", "_words.json"), "w") as wf:
                        json.dump([dataclasses.asdict(w) for w in remapped], wf)

                    _generate_ass(remapped, ass_path, style=style)
                    burned = _burn_ass(tmp_path, ass_path, output_path)
                    if burned and os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                        return True
                    # burn succeeded structurally but produced bad output — fall through to copy
                    print(f"[CLIPPER] Subtitle burn failed or produced empty output — using raw clip")
            except Exception as e:
                print(f"[CLIPPER] Subtitle error: {e}")
            finally:
                if os.path.exists(ass_path):
                    os.remove(ass_path)

        # Fall back to clip without subtitles
        import shutil
        shutil.copy(tmp_path, output_path)
        return os.path.exists(output_path) and os.path.getsize(output_path) > 0

    except Exception as e:
        print(f"Clip render error: {e}")
        return False


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


_FFMPEG_ENCODE = ["-c:v", "libx264", "-c:a", "aac", "-preset", "ultrafast", "-crf", "26"]
_FFMPEG_TIMEOUT = 300  # 5 min hard cap per FFmpeg call


# ---------------------------------------------------------------------------
# Subtitle helpers
# ---------------------------------------------------------------------------

def _get_video_size(video_path: str) -> Tuple[int, int]:
    """Return (width, height) of video via ffprobe."""
    result = subprocess.run(
        [config.FFPROBE_BIN, "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height", "-of", "csv=p=0", video_path],
        capture_output=True, text=True,
    )
    m = re.match(r"(\d+),(\d+)", result.stdout.strip())
    if m:
        return int(m.group(1)), int(m.group(2))
    return 1080, 1920


def _remap_words(
    words: List[WordSegment],
    segments: List[Tuple[float, float]],
) -> List[WordSegment]:
    """Map original-video word timestamps to the jump-cut rendered timeline."""
    padding = config.JUMP_CUT_PADDING
    padded = [(max(0.0, s - padding), e + padding) for s, e in segments]
    padded = _merge_segments(padded)

    cum = 0.0
    seg_map: List[Tuple[float, float, float]] = []
    for orig_s, orig_e in padded:
        seg_map.append((orig_s, orig_e, cum))
        cum += orig_e - orig_s

    def _remap(t: float) -> Optional[float]:
        for orig_s, orig_e, rend_s in seg_map:
            if orig_s - 0.05 <= t <= orig_e + 0.05:
                return max(0.0, rend_s + (t - orig_s))
        return None

    out: List[WordSegment] = []
    for w in words:
        rs = _remap(w.start)
        re_ = _remap(w.end)
        if rs is not None and re_ is not None and re_ > rs:
            out.append(WordSegment(word=w.word, start=rs, end=re_))
    return out


def _time_to_ass(t: float) -> str:
    """Convert seconds to ASS timestamp H:MM:SS.cs"""
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def _generate_ass(words: List[WordSegment], ass_path: str, style: Optional[dict] = None) -> None:
    """Write an ASS subtitle file using dynamic styles."""
    # Fixed 1080×1920 reference resolution so font sizing is consistent
    # regardless of source video dimensions (landscape crop, portrait native, etc.).
    # libass scales subtitles from PlayRes to actual video dimensions automatically.
    PLAY_W, PLAY_H = 1080, 1920

    style = style or {}
    font_name   = style.get("font", "Poppins")
    font_color  = style.get("primary_color", "&H00FFFFFF")
    bold_flag   = -1 if style.get("bold", True) else 0
    italic_flag = 1  if style.get("italic", False) else 0
    text_case   = style.get("text_case", "lowercase")

    font_size_pct = style.get("font_size", 4.0) / 100.0
    fontsize = max(24, int(PLAY_H * font_size_pct))

    letter_spacing = int(style.get("letter_spacing", 0))

    alignment_map = {"left": 1, "center": 2, "right": 3}
    alignment_val = alignment_map.get(style.get("alignment", "center"), 2)

    margin_v_pct = style.get("margin_v", 27.0) / 100.0
    margin_v = max(10, int(PLAY_H * margin_v_pct))

    # Outline (stroke)
    has_outline  = style.get("has_outline", False)
    outline_color = style.get("outline_color", "&H00000000")
    outline_val  = int(style.get("outline_width", 0)) if has_outline else 0

    # Drop shadow
    shadow_val = int(style.get("shadow_size", 2))

    # Background box — encode as BackColour with opacity in ASS alpha byte
    has_bg    = style.get("has_bg", False)
    bg_opacity = int(style.get("bg_opacity", 60))           # 0-100 visible
    ass_alpha  = int((1 - bg_opacity / 100) * 255)           # 0=opaque, 255=transparent
    bg_color_hex = style.get("bg_color", "&H00000000")
    # ASS BackColour: &HAABBGGRR — insert alpha
    if has_bg and len(bg_color_hex) == 10:                   # &H00BBGGRR
        back_color = f"&H{ass_alpha:02X}{bg_color_hex[4:]}"
        border_style = 4                                      # 4 = opaque box
    else:
        back_color   = "&H00000000"
        border_style = 1                                      # 1 = outline+shadow

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {PLAY_W}
PlayResY: {PLAY_H}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{fontsize},{font_color},&H000000FF,{outline_color},{back_color},{bold_flag},{italic_flag},0,0,100,100,{letter_spacing},0,{border_style},{outline_val},{shadow_val},{alignment_val},40,40,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    def _apply_case(word_str: str) -> str:
        if text_case == "uppercase":
            return word_str.upper()
        elif text_case == "lowercase":
            return word_str.lower()
        return word_str

    chars_per_line = max(8, int(PLAY_W / (fontsize * 0.65)))

    def _flush(grp: list) -> None:
        if not grp:
            return
        start = grp[0].start
        end = grp[-1].end
        if end <= start:
            end = start + 0.3
        text = " ".join(_apply_case(word.word) for word in grp)
        lines.append(
            f"Dialogue: 0,{_time_to_ass(start)},{_time_to_ass(end)},Default,,0,0,0,,{text}"
        )

    lines = []
    grp: list = []
    grp_len = 0  # character count of current group (with spaces)

    for w in words:
        wtext = _apply_case(w.word)
        wlen = len(wtext)
        is_sentence_end = w.word and w.word[-1] in ".?!"

        # Adding this word would exceed one line — flush first
        needed = wlen if not grp else 1 + wlen  # leading space if not first word
        if grp and grp_len + needed > chars_per_line:
            _flush(grp)
            grp = []
            grp_len = 0

        grp.append(w)
        grp_len += len(wtext) if not grp_len else 1 + wlen

        # Sentence boundary → flush and start fresh
        if is_sentence_end:
            _flush(grp)
            grp = []
            grp_len = 0

    _flush(grp)

    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(header + "\n".join(lines) + "\n")


def _burn_ass(input_path: str, ass_path: str, output_path: str) -> bool:
    """Burn ASS subtitles into video. Returns True on success."""
    escaped = ass_path.replace("\\", "/").replace(":", "\\:")
    cmd = [
        config.FFMPEG_BIN, "-y",
        "-i", input_path,
        "-vf", f"ass={escaped}",
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "26",
        "-c:a", "copy",
        output_path,
    ]
    try:
        result = subprocess.run(
            cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            timeout=_FFMPEG_TIMEOUT,
        )
        if result.returncode != 0:
            stderr_tail = result.stderr[-500:].decode("utf-8", errors="replace") if result.stderr else ""
            print(f"[FFMPEG] burn_ass failed (code {result.returncode}): {stderr_tail}")
            return False
        return True
    except subprocess.TimeoutExpired:
        print(f"[FFMPEG] burn_ass timed out after {_FFMPEG_TIMEOUT}s — skipping subtitles")
        return False


def _ffmpeg_trim(
    input_video: str, start: float, end: float, output_path: str,
    crop_filter: Optional[str] = None,
):
    print(f"[FFMPEG] trim {start:.1f}s–{end:.1f}s → {os.path.basename(output_path)}")
    vf = crop_filter or None
    cmd = [
        config.FFMPEG_BIN, "-y",
        "-ss", f"{start:.3f}",
        "-to", f"{end:.3f}",
        "-i", input_video,
        *(["-vf", vf] if vf else []),
        *_FFMPEG_ENCODE,
        output_path,
    ]
    _run_ffmpeg(cmd)


def _ffmpeg_concat(
    input_video: str, segments: List[Tuple[float, float]], output_path: str,
    crop_filter: Optional[str] = None,
):
    """Build filter_complex to concat multiple video+audio segments."""
    print(f"[FFMPEG] concat {len(segments)} segments → {os.path.basename(output_path)}")
    filter_parts = []
    crop_chain = f",{crop_filter}" if crop_filter else ""

    for i, (start, end) in enumerate(segments):
        filter_parts.append(
            f"[0:v]trim=start={start:.3f}:end={end:.3f},setpts=PTS-STARTPTS{crop_chain}[v{i}]"
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
    try:
        result = subprocess.run(
            cmd,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
            timeout=_FFMPEG_TIMEOUT,
        )
    except subprocess.TimeoutExpired:
        raise RuntimeError(f"FFmpeg timed out after {_FFMPEG_TIMEOUT}s")
    if result.returncode != 0:
        stderr_tail = ""
        if result.stderr:
            stderr_tail = result.stderr.decode("utf-8", errors="replace")[-1200:]
        raise RuntimeError(
            f"FFmpeg exited with code {result.returncode}. stderr tail:\n{stderr_tail}"
        )


# ---------------------------------------------------------------------------
# Multisource rendering (LLM Batch mode)
# ---------------------------------------------------------------------------

def _map_global_to_local(global_start: float, global_end: float, sources: list) -> tuple:
    # Find the video that contains the midpoint of the segment to avoid boundary edge cases
    midpoint = (global_start + global_end) / 2.0
    best_idx = 0
    for idx, (path, offset, duration, crop) in enumerate(sources):
        if offset <= midpoint <= offset + duration:
            best_idx = idx
            break
            
    path, offset, duration, crop = sources[best_idx]
    
    local_start = max(0.0, global_start - offset)
    local_end = global_end - offset
    
    # Ensure valid FFmpeg timestamps and at least 0.1s length
    local_start = min(local_start, max(0.0, duration - 0.1))
    local_end = max(local_start + 0.1, min(local_end, duration))
    
    return best_idx, path, local_start, local_end, crop


def _merge_multisource_segments(segments: list) -> list:
    if not segments:
        return []
    merged = [list(segments[0])]
    for i in range(1, len(segments)):
        curr = list(segments[i])
        prev = merged[-1]
        if curr[0] == prev[0] and curr[2] <= prev[3]:
            prev[3] = max(prev[3], curr[3])
        else:
            merged.append(curr)
    return [tuple(x) for x in merged]


def _ffmpeg_multisource_concat(segments: list, output_path: str):
    cmd = [config.FFMPEG_BIN, "-y"]
    filter_parts = []
    
    for i, (idx, path, start, end, crop_filter) in enumerate(segments):
        cmd.extend(["-i", path])
        crop_chain = f",{crop_filter}" if crop_filter else ""
        filter_parts.append(
            f"[{i}:v]trim=start={start:.3f}:end={end:.3f},setpts=PTS-STARTPTS{crop_chain}[v{i}]"
        )
        filter_parts.append(
            f"[{i}:a]atrim=start={start:.3f}:end={end:.3f},asetpts=PTS-STARTPTS[a{i}]"
        )

    n = len(segments)
    concat_in = "".join(f"[v{i}][a{i}]" for i in range(n))
    filter_parts.append(f"{concat_in}concat=n={n}:v=1:a=1[outv][outa]")

    cmd.extend([
        "-filter_complex", ";".join(filter_parts),
        "-map", "[outv]",
        "-map", "[outa]",
        *_FFMPEG_ENCODE,
        output_path,
    ])
    _run_ffmpeg(cmd)


def create_multisource_clip_video(
    sources: list,
    clip: Clip,
    output_path: str,
    style: Optional[dict] = None
) -> bool:
    padding = config.JUMP_CUT_PADDING
    trailing_pad = 0.4
    segs = list(clip.segments)
    raw_segments = []
    for i, (s, e) in enumerate(segs):
        end_pad = padding + (trailing_pad if i == len(segs) - 1 else 0)
        raw_segments.append(_map_global_to_local(max(0.0, s - padding), e + end_pad, sources))

    merged = _merge_multisource_segments(raw_segments)
    if not merged:
        return False

    tmp_path = output_path.replace(".mp4", "_raw.mp4")
    try:
        try:
            if len(merged) == 1:
                idx, path, start, end, crop = merged[0]
                _ffmpeg_trim(path, start, end, tmp_path, crop)
            else:
                _ffmpeg_multisource_concat(merged, tmp_path)
        except RuntimeError as e:
            print(f"[CLIPPER] FFmpeg multisource render failed for {os.path.basename(output_path)}: {e}")
            return False
            
        if not os.path.exists(tmp_path) or os.path.getsize(tmp_path) == 0:
            return False

        if clip.words:
            ass_path = output_path.replace(".mp4", ".ass")
            try:
                remapped = _remap_multisource_words(clip.words, merged, sources)
                if remapped:
                    import json, dataclasses
                    with open(output_path.replace(".mp4", "_words.json"), "w") as wf:
                        json.dump([dataclasses.asdict(w) for w in remapped], wf)

                    _generate_ass(remapped, ass_path, style=style)
                    burned = _burn_ass(tmp_path, ass_path, output_path)
                    if burned and os.path.exists(output_path) and os.path.getsize(output_path) > 0:
                        return True
                    print(f"[CLIPPER] Subtitle burn failed or produced empty output — using raw clip")
            except Exception as e:
                print(f"[CLIPPER] Subtitle error (multisource): {e}")
            finally:
                if os.path.exists(ass_path):
                    os.remove(ass_path)

        import shutil
        shutil.copy(tmp_path, output_path)
        return os.path.exists(output_path) and os.path.getsize(output_path) > 0
    except Exception as e:
        print(f"Multisource clip error: {e}")
        return False


def _remap_multisource_words(words: List[WordSegment], merged_segments: list, sources: list) -> List[WordSegment]:
    seg_map = []
    cum = 0.0
    for idx, path, ls, le, crop in merged_segments:
        offset = sources[idx][1]
        gs = offset + ls
        ge = offset + le
        seg_map.append((gs, ge, cum))
        cum += (le - ls)
        
    def _remap(t: float) -> Optional[float]:
        for gs, ge, rs in seg_map:
            if gs - 0.05 <= t <= ge + 0.05:
                return max(0.0, rs + (t - gs))
        return None
        
    out = []
    for w in words:
        rs = _remap(w.start)
        re_ = _remap(w.end)
        if rs is not None and re_ is not None and re_ > rs:
            out.append(WordSegment(word=w.word, start=rs, end=re_))
    return out
