"""
Audio extraction and OpenAI Whisper transcription with word-level timestamps.
"""

import os
import re
import subprocess
from dataclasses import dataclass
from typing import List

from openai import OpenAI

from . import config


@dataclass
class WordSegment:
    word: str
    start: float
    end: float


def extract_audio(video_path: str, audio_path: str) -> None:
    """Extract mono MP3 audio from video at 32kbps for Whisper API."""
    cmd = [
        config.FFMPEG_BIN, "-y",
        "-i", video_path,
        "-vn",
        "-ac", "1",
        "-ar", str(config.AUDIO_SAMPLE_RATE),
        "-b:a", config.AUDIO_BITRATE,
        audio_path,
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg audio extraction failed:\n{result.stderr}")


def get_audio_duration(audio_path: str) -> float:
    """Return duration of audio file in seconds using ffmpeg stderr output."""
    result = subprocess.run(
        [config.FFMPEG_BIN, "-i", audio_path],
        capture_output=True, text=True
    )
    # ffmpeg prints duration to stderr even on "error" exit
    match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.?\d*)", result.stderr)
    if not match:
        raise RuntimeError(f"Could not determine audio duration from: {audio_path}")
    h, m, s = match.groups()
    return int(h) * 3600 + int(m) * 60 + float(s)


def transcribe(audio_path: str) -> List[WordSegment]:
    """
    Transcribe audio using OpenAI Whisper API with word-level timestamps.
    Automatically chunks audio if it exceeds the 25MB API limit.
    """
    client = OpenAI(api_key=config.OPENAI_API_KEY)
    file_size = os.path.getsize(audio_path)

    if file_size <= config.WHISPER_MAX_BYTES:
        return _transcribe_file(client, audio_path)
    else:
        return _transcribe_chunked(client, audio_path)


def _transcribe_file(client: OpenAI, audio_path: str) -> List[WordSegment]:
    with open(audio_path, "rb") as f:
        response = client.audio.transcriptions.create(
            model="whisper-1",
            file=f,
            language=config.WHISPER_LANGUAGE,
            response_format="verbose_json",
            timestamp_granularities=["word"],
        )

    words: List[WordSegment] = []
    if hasattr(response, "words") and response.words:
        for w in response.words:
            word = w.word.strip()
            if word:
                words.append(WordSegment(word=word, start=w.start, end=w.end))
    return words


def _transcribe_chunked(client: OpenAI, audio_path: str) -> List[WordSegment]:
    """Split audio into chunks and transcribe each, adjusting timestamps."""
    total_duration = get_audio_duration(audio_path)
    chunk_dur = config.AUDIO_CHUNK_DURATION
    all_words: List[WordSegment] = []
    chunk_idx = 0
    offset = 0.0

    while offset < total_duration:
        chunk_path = audio_path.replace(".mp3", f"_chunk{chunk_idx}.mp3")
        try:
            # Extract chunk
            subprocess.run(
                [
                    config.FFMPEG_BIN, "-y",
                    "-i", audio_path,
                    "-ss", str(offset),
                    "-t", str(chunk_dur),
                    "-c", "copy",
                    chunk_path,
                ],
                capture_output=True,
                check=True,
            )

            chunk_words = _transcribe_file(client, chunk_path)
            for w in chunk_words:
                w.start += offset
                w.end += offset
            all_words.extend(chunk_words)

        finally:
            if os.path.exists(chunk_path):
                os.remove(chunk_path)

        offset += chunk_dur
        chunk_idx += 1

    return all_words
