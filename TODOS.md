# TODOS

## Security

### Add API key authentication to all /api/* routes
**What:** Add `X-API-Key` header middleware to FastAPI. Simple static key stored in `.env`.
**Why:** Once account manager ships, `/api/accounts` returns a list of stored account metadata and `/api/jobs/{id}/post` triggers posts from all 80 accounts. Without auth, anyone on the same network can access these.
**Pros:** Prevents unauthorized access to TikTok credentials. 30-minute change.
**Cons:** Adds a step for staff to configure the key in their browser/client.
**Context:** Identified in plan-eng-review on 2026-03-29. Currently the app serves only a local frontend, so risk is low. Becomes critical before any cloud deploy or when multiple people access the server.
**Depends on:** Phase 1 account manager completion.

### Lock CORS to app's own origin before cloud deploy
**What:** Add `ALLOWED_ORIGINS` env var (default: `http://localhost:8000`). Replace `allow_origins=["*"]` in main.py CORSMiddleware.
**Why:** Wildcard CORS + stored TikTok session cookies = any webpage can make cross-origin requests to read credentials or trigger posts.
**Pros:** 5-minute change. Eliminates a real attack surface.
**Cons:** Must update .env on deploy with the actual production URL.
**Context:** Identified in plan-eng-review on 2026-03-29. Currently low risk (local app). MUST be fixed before first cloud deployment.
**Depends on:** Cloud deploy step.

---

## Code Quality

### Fix `get_video_dimensions` in reframer.py to use ffprobe JSON
**What:** Replace `re.findall(r"(\d{3,5})x(\d{3,5})", result.stderr)` with `ffprobe -v quiet -print_format json -show_streams` parsed output.
**Why:** The regex can match codec info (e.g., `1280x720` from audio encoder metadata) instead of the video stream dimensions. ffprobe JSON output is deterministic.
**Pros:** Reliable dimension detection across all FFmpeg/ffprobe versions.
**Cons:** Adds a subprocess call. Minor latency increase (~50ms).
**Context:** Identified in plan-eng-review on 2026-03-29. Current regex has worked so far but is fragile.
**Depends on:** Nothing.

### Stream ZIP in `_generate_zip` instead of loading all clips into BytesIO
**What:** Refactor `download_all` in main.py to stream the ZIP bytes as they're written rather than building the entire archive in memory.
**Why:** Currently loads all clips into a single `BytesIO` buffer. For 5 clips × ~10MB = 50MB peak RAM per download request. Not a problem for one user, but adds up under concurrent use.
**Pros:** Reduces memory footprint for downloads.
**Cons:** Slightly more complex implementation (write-to-pipe or thread-based pattern).
**Context:** Identified in plan-eng-review on 2026-03-29. Acceptable for Phase 1 single-customer use.
**Depends on:** Nothing. Phase 2 cleanup.
