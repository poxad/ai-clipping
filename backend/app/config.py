import os
import shutil
from dotenv import load_dotenv

load_dotenv()


def _find_ffmpeg() -> str:
    """Return path to ffmpeg binary. Falls back to imageio_ffmpeg bundle."""
    system_ffmpeg = shutil.which("ffmpeg")
    if system_ffmpeg:
        return system_ffmpeg
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        raise RuntimeError(
            "FFmpeg not found. Install it via: brew install ffmpeg\n"
            "Or: pip install imageio[ffmpeg]"
        )


def _find_ffprobe() -> str:
    """Return path to ffprobe binary. Falls back to ffprobe next to imageio ffmpeg."""
    system_ffprobe = shutil.which("ffprobe")
    if system_ffprobe:
        return system_ffprobe
    try:
        import imageio_ffmpeg
        ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
        # imageio_ffmpeg bundles ffprobe in the same directory
        ffprobe_path = ffmpeg_path.replace("ffmpeg-", "ffprobe-")
        if os.path.exists(ffprobe_path):
            return ffprobe_path
        # Fallback: use ffmpeg itself for probing (it supports -f null)
        return ffmpeg_path
    except ImportError:
        raise RuntimeError("FFprobe not found.")


FFMPEG_BIN: str = _find_ffmpeg()
FFPROBE_BIN: str = _find_ffprobe()

OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "uploads")
OUTPUT_DIR: str = os.getenv("OUTPUT_DIR", "outputs")

# --- Clipping parameters ---

# Gap between words (seconds) to split into a new utterance
SILENCE_THRESHOLD: float = 1.5

# Gap between utterances (seconds) to declare a new scene
SCENE_BREAK_THRESHOLD: float = 3.0

# Target clip duration range
MIN_CLIP_DURATION: float = 15.0
MAX_CLIP_DURATION: float = 45.0

# Clips with less than this much speech are discarded
MIN_VIABLE_SPEECH: float = 5.0

# Silence padding kept around each speech segment for jump cuts
JUMP_CUT_PADDING: float = 0.3

# Silence gap between words that triggers a jump cut within a clip.
# Any pause longer than this between consecutive words will be cut out.
# 0.6s was too aggressive — cutting natural speech pauses made clips feel choppy.
# 1.2s only removes clearly dead air while preserving natural rhythm.
WORD_GAP_THRESHOLD: float = 1.2

# Whisper language code (Indonesian)
WHISPER_LANGUAGE: str = "id"

# Custom vocabulary hint passed to Whisper as a prompt.
# List brand names, product terms, or any words Whisper keeps mishearing.
# Example: "Kacamata Moo, lensa kontak, frame, minus, silinder, cek mata."
WHISPER_PROMPT: str = os.getenv("WHISPER_PROMPT", "")

# --- TikTok integration ---

TIKTOK_CLIENT_KEY: str = os.getenv("TIKTOK_CLIENT_KEY", "")
TIKTOK_CLIENT_SECRET: str = os.getenv("TIKTOK_CLIENT_SECRET", "")
TIKTOK_REDIRECT_URI: str = os.getenv("TIKTOK_REDIRECT_URI", "http://localhost:8000/api/tiktok/callback")

# SQLite database for scheduler
DB_PATH: str = os.getenv("DB_PATH", "scheduler.db")

# --- Whisper audio extraction settings
AUDIO_SAMPLE_RATE: int = 16000
AUDIO_BITRATE: str = "32k"

# Max Whisper API file size (bytes) — 24MB safety margin under 25MB limit
WHISPER_MAX_BYTES: int = 24 * 1024 * 1024

# Chunk duration (seconds) when audio exceeds WHISPER_MAX_BYTES
AUDIO_CHUNK_DURATION: int = 600  # 10 minutes
