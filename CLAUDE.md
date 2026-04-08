# AI Clipping Platform

## Project Overview
Automated video clipping tool for retail stores. Staff upload long-form customer service videos; AI transcribes, clips into 15-30s shorts, and outputs ready-to-post TikTok clips.

## Client Context
- **Client**: Michael (store owner, 80 TikTok accounts)
- **Use case**: Staff record themselves serving customers (portrait video), AI clips into TikTok shorts
- **All 80 accounts post the same clips** — no per-account personalization needed yet
- **Next phase**: TikTok auto-scheduler (not built yet)

## Tech Stack
- **Backend**: FastAPI (Python 3.11+)
- **Transcription**: OpenAI Whisper API (`whisper-1`), language: Indonesian (`id`)
- **Video Processing**: FFmpeg (required, must be installed separately)
- **Frontend**: Vanilla HTML/CSS/JS (single file, served by FastAPI)

## Project Structure
```
ai-clipping/
├── CLAUDE.md
├── .env                   # API keys (never commit)
├── .gitignore
├── requirements.txt
├── backend/
│   ├── __init__.py
│   ├── main.py            # FastAPI app, endpoints, job management
│   ├── config.py          # Settings and environment vars
│   ├── transcriber.py     # Audio extraction + Whisper transcription
│   └── clipper.py         # Core clipping algorithm + FFmpeg rendering
├── frontend/
│   └── index.html         # Single-page upload + clip preview UI
├── uploads/               # Created at runtime — raw uploaded videos
└── outputs/               # Created at runtime — job folders with clips
```

## Clipping Algorithm
1. **Whisper** transcribes video with word-level timestamps (language: Indonesian)
2. **Utterances**: group consecutive words where gap < 1.5s
3. **Scenes**: group utterances where gap < 3.0s (silence = scene break)
4. **Scene merging**: adjacent short scenes (<15s) are merged if combined ≤ 30s
5. **Clip splitting**: scenes >30s are split at utterance boundaries targeting 15-30s each
6. **Jump cuts**: internal silences removed via FFmpeg filter_complex concat
7. **Skip**: scenes with <5s total speech are discarded

## Key Parameters (config.py)
| Parameter | Value | Meaning |
|---|---|---|
| SILENCE_THRESHOLD | 1.5s | Gap between words → new utterance |
| SCENE_BREAK | 3.0s | Gap between utterances → new scene |
| MIN_CLIP | 15s | Target minimum clip duration |
| MAX_CLIP | 30s | Target maximum clip duration |
| MIN_VIABLE | 5s | Discard clips shorter than this |
| JUMP_CUT_PADDING | 0.1s | Buffer around each speech segment |

## Running the Project
```bash
# 1. Install FFmpeg (macOS)
brew install ffmpeg
# OR download from https://ffmpeg.org/download.html and add to PATH

# 2. Set up Python environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Run the server
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# 4. Open browser
open http://localhost:8000
```

## API Endpoints
| Method | Path | Description |
|---|---|---|
| POST | `/api/upload` | Upload video, returns `job_id` |
| GET | `/api/status/{job_id}` | Poll job progress + status |
| GET | `/api/video/{job_id}/{clip_name}` | Stream a clip video |
| GET | `/api/download/{job_id}` | Download all clips as ZIP |

## Environment Variables (.env)
```
OPENAI_API_KEY=sk-proj-...
UPLOAD_DIR=uploads
OUTPUT_DIR=outputs
```

## Known Limitations (Prototype)
- Jobs stored in-memory (lost on server restart) → use Redis/SQLite for production
- Sequential processing (one job at a time) → use Celery for production
- Whisper API file limit: 25MB audio. At 32kbps mono MP3, this covers ~1.7 hours
- No subtitle generation yet (Phase 2)
- No TikTok auto-posting yet (Phase 2)

## Phase 2 Roadmap
- [ ] Subtitle generation (word-by-word highlight style)
- [ ] Subtitle editor (font, color, position)
- [ ] TikTok auto-scheduler (80 accounts)
- [ ] Store dashboard (monitor upload status per store)
- [ ] Persistent job storage (SQLite)

## gstack

For all web browsing tasks, use the `/browse` skill from gstack. Never use `mcp__claude-in-chrome__*` tools directly.

### Setup (run once per machine)
```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
cd ~/.claude/skills/gstack && ./setup
```
> Requires `bun`. If not installed: `curl -fsSL https://bun.sh/install | BUN_VERSION=1.3.10 bash`

### Available skills
`/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`, `/design-shotgun`, `/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/connect-chrome`, `/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`, `/retro`, `/investigate`, `/document-release`, `/codex`, `/cso`, `/autoplan`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`
