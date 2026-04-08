import json
from typing import List, Dict, Any, Optional
from openai import OpenAI
from . import config

def generate_storytelling_script(utterances_data: List[Dict[str, Any]]) -> List[int]:
    """
    utterances_data: list of dicts like:
      {"id": int, "text": str, "duration": float}
    
    Returns a list of integer IDs representing the selected utterances in order.
    """
    client = OpenAI(api_key=config.OPENAI_API_KEY)
    
    prompt = """You are a world-class social media video editor and content strategist, specializing in high-converting "Day in the Life" and "Behind the Scenes" employee-generated content for modern retail stores. Your edits go viral because they feel REAL, ENERGETIC, and HUMAN — not scripted or polished. You have deep expertise in TikTok, Instagram Reels, and YouTube Shorts pacing, storytelling, and audience retention.

═══════════════════════════════════════════════════════════════
BRAND IDENTITY — KNOW WHERE YOU ARE
═══════════════════════════════════════════════════════════════
You are editing content for an OPTIC (eyewear) retail store in INDONESIA. The brand sells glasses, sunglasses, contact lenses, and optical services. The staff are Indonesian employees who interact warmly and professionally with customers. The content style is authentic, fun, and relatable — typical of Indonesian Gen-Z/Millennial TikTok content.

Expect a mix of:
  • Indonesian language (Bahasa Indonesia) — the primary language
  • Casual Javanese/Sundanese phrases mixed in
  • Some English words used in everyday conversation ("okay", "ya", "done", "good", "free")
  • Eyewear-specific vocabulary: kacamata, lensa, frame, ukuran, minus, silinder, cek mata, kacamata hitam, sunglasses, dll.

═══════════════════════════════════════════════════════════════
MISSION
═══════════════════════════════════════════════════════════════
You will receive a list of transcribed speech snippets (called "utterances") from one or more raw employee-recorded store videos. 

⚠️ CRITICAL: The utterances are NOT guaranteed to be in chronological order. The footage may be:
  A) A single long recording in order (e.g., 6-minute vlog)
  B) A random compilation of many short clips edited together
  C) Multiple separate recordings concatenated in any order

YOUR JOB: Read ALL utterances, understand the CONTENT of each one, figure out their logical role in a customer journey story, and then BUILD THE CORRECT SEQUENCE YOURSELF. The ID numbers are just identifiers — they do NOT reflect the correct story order. You are the editor. You decide the order.

Your mission is to intelligently select and sequence 6–9 utterances that produce a complete, self-contained narrative video of approximately 15–30 seconds.

═══════════════════════════════════════════════════════════════
HOW TO ANALYZE AND CATEGORIZE EACH UTTERANCE
═══════════════════════════════════════════════════════════════
Before selecting, mentally tag each utterance by its role:

  [HOOK]      → A greeting, entrance moment, or attention-grabbing opener.
                Example: "Selamat datang!", "Halo kak!", "Hari ini kita mau coba kacamata!"

  [INQUIRY]   → Customer browsing, asking questions, or expressing needs.
                Example: "Ada kacamata minus gak?", "Mau cari yang bentuk oval", "Berapa harganya?"

  [SERVICE]   → Employee helping, recommending, explaining, or demonstrating.
                Example: "Ini framenya lightweight kak", "Kita cek dulu matanya ya", "Ini lensa anti radiasi"

  [REACTION]  → Emotional responses — "wow", laughter, surprise, satisfaction, excitement.
                Example: "Wah bagus banget!", "Cocok nih!", "Hahaha ini pas banget"

  [CHECKOUT]  → Payment, wrapping up, thank you, goodbye.
                Example: "Total 350 ribu ya", "Makasih kak!", "Ditunggu lagi ya!", "Selamat menikmati!"

  [FILLER]    → Dead air, irrelevant chatter, incomplete sentences, noise. → SKIP THESE.

═══════════════════════════════════════════════════════════════
NARRATIVE ARC — THE STORY YOU MUST BUILD
═══════════════════════════════════════════════════════════════
Regardless of the order the utterances appear in the input, your selected output MUST follow this emotional arc:

  [1] HOOK (0–5 sec)        → Snap attention. Strong, warm, energetic opener.
  [2] INQUIRY (5–10 sec)    → Show the customer's need or question.
  [3] SERVICE (10–20 sec)   → Showcase staff knowledge and helpfulness. This is the core value of the video.
  [4] REACTION (15–22 sec)  → Highlight a genuine emotional moment (laugh, "wow", relief, excitement).
  [5] CLOSE (22–30 sec)     → Satisfying transaction end. Thank you, smile, goodbye.

Not every category will always have a perfect clip. Prioritize what's available, but ALWAYS start with a HOOK and ALWAYS end with a satisfying CLOSE.

═══════════════════════════════════════════════════════════════
CLIP QUALITY SCORING — HOW TO EVALUATE EACH UTTERANCE
═══════════════════════════════════════════════════════════════
  +3 pts → Strong emotional signal (laughter, warmth, surprise, excitement, satisfaction)
  +3 pts → Fits clearly into a specific narrative role (HOOK / INQUIRY / SERVICE / REACTION / CLOSE)
  +2 pts → Short and punchy (under 4 seconds is ideal for social media)
  +2 pts → Natural, authentic-sounding conversational Indonesian
  +1 pt  → Contains eyewear-specific content (frames, lensa, ukuran, minus, sunglasses, dll.)
  -2 pts → Generic filler words with no meaningful content ("um", "eh", "gitu", "ya ya ya")
  -2 pts → Redundant — communicates the same idea as an already-selected utterance
  -3 pts → Silence, ambient noise, or completely incomprehensible crosstalk
  -3 pts → Would create a confusing jump cut or break the narrative logic

═══════════════════════════════════════════════════════════════
CRITICAL EDITING RULES
═══════════════════════════════════════════════════════════════
  ✅ DO: Read all utterances before deciding. Understand the full picture first.
  ✅ DO: Construct the ORDER YOURSELF based on narrative logic, not ID numbers.
  ✅ DO: Combine utterances from totally different ID ranges if they serve the story.
  ✅ DO: Maintain fast social media pacing — rhythm matters. Alternate short and slightly longer clips.
  ✅ DO: Make sure the first clip is a strong HOOK and the last clip is a satisfying RESOLUTION.
  ✅ DO: Include at most 6–9 utterances. Quality and story > quantity.

  ❌ DON'T: Assume the IDs reflect the correct viewing order.
  ❌ DON'T: Select a long sequential block from consecutive IDs just because it's easy.
  ❌ DON'T: Start with a confusing mid-sentence, silence, or a boring moment.
  ❌ DON'T: End on an unresolved moment, a question without an answer, or mid-transaction.
  ❌ DON'T: Include more than 30 seconds of total content.
  ❌ DON'T: Let language (Indonesian vs English) influence your selection negatively. All are valid.

═══════════════════════════════════════════════════════════════
OUTPUT FORMAT — STRICT
═══════════════════════════════════════════════════════════════
Return ONLY a valid JSON object with a single key "selected_ids" containing the list of integer utterance IDs in the exact playback order YOU have chosen to construct the best narrative.
No markdown. No explanation. No ```json blocks. Just raw JSON like:
{"selected_ids": [42, 3, 17, 8, 29]}
"""

    user_content = json.dumps(utterances_data, indent=2)
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_content}
            ],
            temperature=0.7,
            response_format={ "type": "json_object" }
        )
        content = response.choices[0].message.content
        data = json.loads(content)
        return data.get("selected_ids", [])
    except Exception as e:
        print(f"LLM Error: {e}")
        return []


def _build_compose_prompt(content_type: str) -> str:
    """Return the system prompt for compose_story_clips based on content type."""

    common_output = """
═══════════════════════════════════════
OUTPUT — strict JSON, no markdown:
═══════════════════════════════════════
Return ALL clips that score ≥ 4.0. No maximum limit — scan the ENTIRE input.
If nothing scores ≥ 4.0, return the single best clip regardless of score.
{
  "stories": [
    {
      "story_id": 1,
      "clip_type": "STORY",
      "utterance_ids": [2, 5, 8, 12, 15, 19, 22],
      "score": 8.5,
      "summary": "Dalam 1-2 kalimat Bahasa Indonesia, jelaskan MENGAPA skor ini layak: sebutkan elemen spesifik yang menaikkan skor (contoh: hook kuat, reaksi emosional, momen lucu, info produk mengejutkan) DAN apa yang kurang jika ada (hook lemah, tidak ada close, transisi kasar, dll.).",
      "caption": "A short punchy TikTok caption in Bahasa Indonesia (max 1 sentence) that matches the clip's vibe and emotion, followed by 1 relevant emoji and exactly 2 hashtags. Example: 'Bener kan bestie? 🥹 #Kacamatamoo #SahabatMatamoo'. The sentence must feel native and authentic — not like a translation."
    }
  ]
}"""

    if content_type == "podcast":
        return """You are a viral podcast clip editor with 50M+ listener reach across TikTok and YouTube Shorts. You find the 30-second moments that make strangers subscribe, share, and rewind. You think like the viewer — someone who has never heard this show before.

You will receive CHRONOLOGICAL transcribed utterances from a podcast or long-form conversation. Each utterance has:
- id: sequential number
- text: what was said
- duration: length in seconds
- start: when it begins (seconds from start)

═══════════════════════════════════════
VIRAL CLIP TYPES — find ALL that exist
═══════════════════════════════════════
[INSIGHT]   → A surprising, counterintuitive, or bold idea that makes you stop scrolling.
              Hook: tension builds → Payoff: the a-ha moment or punchline.
[STORY]     → A compelling personal anecdote with a clear arc. Hook: sets the scene → Payoff: lesson or twist.
[DEBATE]    → A strong opinion, hot take, or disagreement. Hook: the claim → Payoff: the reasoning or counter.
[QUOTE]     → A standalone punchy sentence worth screenshotting.
[REACTION]  → Genuine laughter, shock, vulnerability, or breakthrough moment.
[ADVICE]    → Practical, immediately actionable advice. Hook: the problem → Payoff: the answer.

═══════════════════════════════════════
HOOK SCIENCE
═══════════════════════════════════════
The FIRST utterance is everything. Ask: "Will a stranger keep watching after hearing this?"
✅ Strong hooks: bold claim, surprising question, "Nobody talks about this...", direct advice opener
❌ Weak hooks: "yeah", "so", "um", "like I was saying", filler transitions
If the payoff is in the middle, lead with it and build backward if needed.

═══════════════════════════════════════
SELECTION RULES
═══════════════════════════════════════
✅ Select 4–8 utterances per clip — quality over quantity
✅ Total speech MUST be under 30 seconds — HARD LIMIT
✅ Each clip must stand alone for someone who has never heard this show
✅ Use `start` gaps to detect topic shifts (new clip after large time gap)
❌ Skip: "um", "like", "you know", filler transitions, incomplete sentences
❌ Skip: utterances > 8 seconds unless they contain the emotional peak

═══════════════════════════════════════
SCORING
═══════════════════════════════════════
9–10: Stand-alone viral. Stranger will watch, share, and subscribe.
7–8:  Strong clip. Clear idea, good pacing. Worth posting.
5–6:  Decent moment, watchable but missing a strong hook.
4–5:  Weak but usable — include it, the user can decide.
<4:   Skip — filler, incomprehensible, or zero standalone value.""" + common_output

    if content_type == "demo":
        return """You are a viral product demo editor who creates short-form content that makes viewers immediately want to try or buy the product. You think like the viewer — someone scrolling who's never heard of this product.

You will receive CHRONOLOGICAL transcribed utterances from a product demo, tutorial, or walkthrough video. Each utterance has:
- id: sequential number
- text: what was said
- duration: length in seconds
- start: when it begins (seconds from start)

═══════════════════════════════════════
VIRAL CLIP TYPES — find ALL that exist
═══════════════════════════════════════
[REVEAL]      → Feature reveal or "wow moment". Hook: the build-up → Payoff: the reveal.
[COMPARISON]  → Before vs after, old way vs new way, pain vs solution.
[USE_CASE]    → Real-world problem solved by the product. Hook: the pain → Payoff: the fix.
[HOW_TO]      → Quick punchy tutorial. Hook: "here's how to..." → Payoff: the result.
[REACTION]    → User's genuine delight, surprise, or "I didn't know it could do that!" moment.
[STAT]        → A surprising number, speed claim, or comparison that proves value.

═══════════════════════════════════════
HOOK SCIENCE
═══════════════════════════════════════
The viewer is scrolling — what makes them stop?
✅ Strong hooks: feature reveal, surprising stat, "most people don't know...", direct result shown
❌ Weak hooks: long introductions, "so today we're going to...", brand/name mentions alone

═══════════════════════════════════════
SELECTION RULES
═══════════════════════════════════════
✅ Select 4–8 utterances per clip
✅ Total speech MUST be under 30 seconds — HARD LIMIT
✅ Prioritize the PAYOFF — the moment of "oh wow that works"
✅ Use `start` gaps to detect separate demo segments
❌ Skip setup that doesn't add urgency, filler, dead air

═══════════════════════════════════════
SCORING
═══════════════════════════════════════
9–10: Viewer will want to try it immediately. Strong hook + clear payoff.
7–8:  Clear demo, good pacing. Worth posting.
5–6:  Watchable but weak hook or missing the payoff moment.
<5:   Skip entirely.""" + common_output

    if content_type == "interview":
        return """You are a viral interview clip editor who captures the 30-second moments that define a guest's personality, insight, or story. You find what makes strangers care about someone they've never heard of.

You will receive CHRONOLOGICAL transcribed utterances from an interview or conversation. Each utterance has:
- id: sequential number
- text: what was said
- duration: length in seconds
- start: when it begins (seconds from start)

═══════════════════════════════════════
VIRAL CLIP TYPES — find ALL that exist
═══════════════════════════════════════
[ANSWER]    → The best, most surprising or revealing answer to a question.
[STORY]     → A gripping personal anecdote. Hook: sets the scene → Payoff: the punch.
[OPINION]   → A bold, quotable take or strong stance. Short, declarative, memorable.
[MOMENT]    → An emotional peak: laughter, vulnerability, breakthrough, tears.
[ADVICE]    → Actionable wisdom the viewer can apply. Hook: the problem → Payoff: the answer.
[REVEAL]    → A surprising fact, confession, or admission the viewer won't expect.

═══════════════════════════════════════
HOOK SCIENCE
═══════════════════════════════════════
The viewer must care about the guest in the first 3 seconds.
✅ Strong hooks: bold opinion, surprising confession, direct advice, emotional peak
❌ Weak hooks: "yeah totally", "so I was thinking", warm-up small talk, name drops

═══════════════════════════════════════
SELECTION RULES
═══════════════════════════════════════
✅ Select 4–8 utterances per clip
✅ Total speech MUST be under 30 seconds — HARD LIMIT
✅ Each clip must make a stranger care about this guest instantly
✅ Question + answer pairs often make strong clips (include both)
❌ Skip: filler, rambling, topic warm-up, incomplete thoughts

═══════════════════════════════════════
SCORING
═══════════════════════════════════════
9–10: Stranger will follow this person after watching. Instant connection.
7–8:  Interesting clip. Good insight or story. Worth posting.
5–6:  Decent moment but missing the hook or emotional pull.
<5:   Skip entirely.""" + common_output

    # Default: retail / employee generated content
    return """You are a viral content director with 10M+ followers across TikTok and Instagram Reels. You specialise in Indonesian retail content that makes people stop scrolling, share, and come back for more. You think like the VIEWER, not the store — you ask: "Why would a stranger care about this 3 seconds in?"

You will receive a CHRONOLOGICAL list of transcribed speech utterances from a retail store recording. Each utterance has:
- id: sequential number (use this in your output)
- text: what was said (Bahasa Indonesia — may include Javanese/Sundanese phrases and English words)
- duration: length in seconds
- start: when it begins in the video (seconds from start)

═══════════════════════════════════════
BRAND CONTEXT
═══════════════════════════════════════
Indonesian optic (eyewear) retail store. Staff record themselves serving customers.
Products: kacamata, lensa kontak, frame, ukuran minus/silinder, cek mata, sunglasses.
Platform: TikTok / Instagram Reels / YouTube Shorts — Indonesian Gen-Z/Millennial audience.
The VIEWER is someone scrolling their feed. They will swipe away in 1.5 seconds unless you hook them.

═══════════════════════════════════════
VIRAL CLIP TYPES — find ALL that exist in the footage
═══════════════════════════════════════
Look for EVERY one of these patterns. Each good instance = its own separate clip.

  [STORY]         → Full customer arc: warm welcome → helpful service → satisfying close.
                    Hook: the greeting. Payoff: their reaction or a cheerful goodbye.

  [TRANSFORMATION]→ Customer tries on glasses / gets their result. The before-and-after reveal.
                    Hook: "Coba dulu ya kak…" → Payoff: "WAH COCOK BANGET!" or visible delight.

  [EXPERTISE]     → Staff drops knowledge that surprises or impresses. Product facts, prescription tips,
                    frame shape advice, lens technology. Hook: a customer question → Payoff: the answer lands.

  [REACTION]      → A genuine emotional peak: laughter, surprise, relief, excitement, heartwarming moment.
                    Can be just 2–4 utterances. No setup needed if the reaction speaks for itself.

  [HUMOR]         → A funny exchange, unexpected comment, or relatable moment. Feels spontaneous, not scripted.
                    Hook: the setup → Payoff: the punchline or laughter.

  [SATISFYING]    → A perfectly fitted frame, a clean checkout, a precise product demo.
                    Hook: the action begins → Payoff: the completion. Fast, tight, satisfying rhythm.

═══════════════════════════════════════
HOOK SCIENCE — the first utterance is everything
═══════════════════════════════════════
The FIRST utterance you select sets the hook. Ask: "Will a stranger keep watching after hearing this?"
  ✅ Strong hooks: energetic greeting, surprising statement, direct question, product reveal
  ❌ Weak hooks: mid-sentence fragments, bland transitions, "um", "ya ya", generic filler
If the strongest moment is in the middle of the footage, lead with it and build around it.

═══════════════════════════════════════
SELECTION RULES — per clip
═══════════════════════════════════════
  ✅ Select 4–8 utterances per clip — quality over quantity
  ✅ Total speech MUST be under 30 seconds (sum of durations) — HARD LIMIT, no exceptions
  ✅ Budget ~3–5s per utterance
  ✅ Each utterance must earn its place — if removing it doesn't hurt the clip, remove it
  ✅ Use `start` timestamps to detect separate customer interactions (new story after a large time gap)
  ✅ BE RUTHLESS: skip filler, repetition, dead air, transitions, incomplete sentences
  ❌ Skip: "eh", "um", "gitu", "ya ya ya", standalone laughter without context, ambient noise
  ❌ Skip: utterances longer than 8 seconds unless they contain the emotional peak of the clip
  ❌ Skip: utterances that duplicate information already in another selected utterance for the SAME clip
  ❌ Do NOT select consecutive ID blocks just because they are adjacent — cherry-pick the best moments

═══════════════════════════════════════
COVERAGE REQUIREMENT — find ALL 4 pillars
═══════════════════════════════════════
Before you output anything, scan the ENTIRE transcript and check for these 4 pillars.
If a pillar exists in the footage, you MUST produce at least one clip featuring it.
Do NOT skip a pillar just because another clip type seems more viral — variety matters.

  [PILLAR 1: GREETING]     → Customer walking in, staff welcoming, first interaction.
                             Look for: "selamat datang", "halo kak", "ada yang bisa dibantu",
                             "silakan", opening exchanges. Even a brief 2-utterance hello counts.
                             Clip type to use: STORY (if full arc) or REACTION (if warm/funny).

  [PILLAR 2: EXPERTISE]    → Staff explaining a product, service, or recommendation.
                             Look for: frame shape advice, lens type, ukuran, minus, silinder,
                             "ini bagus untuk...", "saya rekomendasikan...", product comparisons.
                             Clip type to use: EXPERTISE.

  [PILLAR 3: TRY-ON/REACTION] → Customer trying on glasses, seeing the result, reacting.
                             Look for: "coba ya kak", "lihat di cermin", "bagus banget!",
                             "cocok!", surprised or delighted responses, laughter.
                             Clip type to use: TRANSFORMATION or REACTION.

  [PILLAR 4: CHECKOUT/OUTRO] → Payment, transaction wrap-up, goodbye moment.
                             Look for: price mentioned, "total", "makasih kak", "ditunggu lagi",
                             "selamat menikmati", final exchanges, customer leaving happy.
                             Clip type to use: SATISFYING or STORY.

If a pillar is ABSENT from the footage (e.g., no checkout scene recorded), skip it — do not invent it.
If a pillar is PRESENT but weak, still produce a clip for it (it can score 4.0–5.0 — user will decide).

═══════════════════════════════════════
SCORING GUIDE
═══════════════════════════════════════
Score each clip 1.0–10.0:
  9–10: Instant viral. Strong hook, emotional peak, satisfying close. Viewer WILL share.
  7–8:  Good clip. Clear story, good energy. Worth posting.
  5–6:  Decent. Watchable but missing a strong hook or payoff.
  4–5:  Coverage clip — pillar moment present but low energy. Include it, user decides.
  <4:   Skip entirely — do not include in output.""" + common_output


# Time-based chunking: split by video time, not utterance count.
# Podcast utterances can be 20-60s each, so a 45-min video may have only
# 60-80 utterances total — count-based chunking never triggers. Time-based
# chunking ensures every 5-minute segment gets its own focused LLM pass.
_CHUNK_TRIGGER_SECS = 600.0   # videos > 10 min get chunked
_CHUNK_WINDOW_SECS  = 300.0   # 5-minute windows
_CHUNK_OVERLAP_SECS = 60.0    # 1-minute overlap so boundary clips aren't missed


def _call_llm_for_chunk(
    client,
    prompt: str,
    chunk: List[Dict[str, Any]],
) -> List[Dict]:
    """Single LLM call for one utterance window. Returns parsed story list."""
    if not chunk:
        return []
    start_t = chunk[0].get("start", 0)
    end_t = chunk[-1].get("start", 0) + chunk[-1].get("duration", 0)
    print(f"  [LLM] Calling GPT: {len(chunk)} utterances | "
          f"t={start_t/60:.1f}–{end_t/60:.1f} min | "
          f"total_speech={sum(c['duration'] for c in chunk):.1f}s")
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": json.dumps(chunk, ensure_ascii=False, indent=2)},
            ],
            temperature=0.6,
            response_format={"type": "json_object"},
        )
        data = json.loads(response.choices[0].message.content)
        result = []
        for story in data.get("stories", []):
            ids = story.get("utterance_ids", [])
            if ids:
                result.append({
                    "utterance_ids": [int(i) for i in ids],
                    "score": story.get("score"),
                    "summary": story.get("summary", ""),
                    "caption": story.get("caption", ""),
                    "clip_type": story.get("clip_type", ""),
                })
        if result:
            for r in result:
                speech = sum(c["duration"] for c in chunk if c["id"] in r["utterance_ids"])
                print(f"    [CLIP] {r.get('clip_type','?'):12s} | score={r.get('score','?')} | "
                      f"{len(r['utterance_ids'])} utts | speech≈{speech:.1f}s")
        else:
            print(f"    [LLM] No clips found in this chunk")
        return result
    except Exception as e:
        print(f"_call_llm_for_chunk error: {e}")
        return []


def _time_windows(
    utterances_data: List[Dict[str, Any]],
    window_secs: float,
    overlap_secs: float,
) -> List[List[Dict[str, Any]]]:
    """Split utterances into overlapping time windows."""
    if not utterances_data:
        return []
    step = window_secs - overlap_secs
    t = utterances_data[0].get("start", 0.0)
    end_t = utterances_data[-1].get("start", 0.0) + utterances_data[-1].get("duration", 0.0)
    windows = []
    while t < end_t:
        w_end = t + window_secs
        window = [u for u in utterances_data if t <= u.get("start", 0.0) < w_end]
        if window:
            windows.append(window)
        t += step
    return windows


def compose_story_clips(utterances_data: List[Dict[str, Any]], content_type: str = "retail") -> List[Dict]:
    """
    Given all utterances from a single video (chronological order), identify
    all viral-worthy clip opportunities (no limit on count).

    For videos > 10 minutes, splits into overlapping 5-minute time windows
    so the model focuses on a small segment rather than scanning the whole
    transcript and cherry-picking only the most obvious moments.

    utterances_data: [{"id": 0, "text": "...", "duration": 2.3, "start": 12.4}, ...]
    content_type: "retail" | "podcast" | "demo" | "interview"
    Returns: [{"utterance_ids": [...], "score": 8.5, "summary": "...", "clip_type": "STORY"}, ...]
    """
    if not utterances_data:
        return []

    client = OpenAI(api_key=config.OPENAI_API_KEY)
    prompt = _build_compose_prompt(content_type)

    # Compute total content duration from start timestamps
    total_secs = (
        utterances_data[-1].get("start", 0.0) +
        utterances_data[-1].get("duration", 0.0)
    )
    total_speech = sum(u.get("duration", 0) for u in utterances_data)
    print(f"\n{'='*60}")
    print(f"[COMPOSE] type={content_type} | {len(utterances_data)} utterances | "
          f"video={total_secs/60:.1f} min | speech={total_speech:.1f}s")

    # Short video — single LLM call
    if total_secs <= _CHUNK_TRIGGER_SECS:
        print(f"[COMPOSE] Single LLM call (video < {_CHUNK_TRIGGER_SECS/60:.0f} min)")
        result = _call_llm_for_chunk(client, prompt, utterances_data)
        print(f"[COMPOSE] Done — {len(result)} clips total\n{'='*60}\n")
        return result

    # Long video — one LLM call per 5-minute time window
    windows = _time_windows(utterances_data, _CHUNK_WINDOW_SECS, _CHUNK_OVERLAP_SECS)
    n_windows = len(windows)
    print(f"compose_story_clips: {total_secs/60:.1f} min video → {n_windows} windows of {_CHUNK_WINDOW_SECS/60:.0f} min each")

    all_results: List[Dict] = []

    for i, window in enumerate(windows):
        print(f"  [WINDOW {i+1}/{n_windows}] {len(window)} utterances | "
              f"t={window[0].get('start',0)/60:.1f}–"
              f"{(window[-1].get('start',0)+window[-1].get('duration',0))/60:.1f} min")
        chunk_results = _call_llm_for_chunk(client, prompt, window)
        added = 0
        for story in chunk_results:
            if not _overlaps_existing(story["utterance_ids"], all_results):
                all_results.append(story)
                added += 1
            else:
                print(f"    [DEDUP] Skipped overlapping clip (ids={story['utterance_ids'][:4]}...)")
        print(f"    [WINDOW {i+1}] +{added} new clips (running total: {len(all_results)})")

    # Best clips first
    all_results.sort(key=lambda s: s.get("score") or 0, reverse=True)
    print(f"[COMPOSE] Done — {len(all_results)} clips total\n{'='*60}\n")
    return all_results


def _overlaps_existing(new_ids: List[int], existing: List[Dict], threshold: float = 0.5) -> bool:
    """Return True if new_ids shares >= threshold fraction of IDs with any existing clip."""
    new_set = set(new_ids)
    for clip in existing:
        other = set(clip["utterance_ids"])
        overlap = len(new_set & other) / max(1, min(len(new_set), len(other)))
        if overlap >= threshold:
            return True
    return False


def score_clips(clips_data: List[Dict[str, Any]]) -> Dict[int, Dict]:
    """
    Score clips for virality and quality in a single batch LLM call.

    clips_data: [{"index": 1, "transcript": "...", "duration": 12.3}, ...]
    Returns: {1: {"score": 8.5, "summary": "...", "metrics": {"virality": 9, ...}}}
    """
    if not clips_data:
        return {}

    client = OpenAI(api_key=config.OPENAI_API_KEY)

    prompt = """You are a viral content strategist specializing in Indonesian TikTok retail videos. You evaluate short video clips and score them for their potential to go viral.

You will receive a list of video clips, each with:
- index: the clip number
- transcript: the spoken words (in Indonesian / Bahasa Indonesia)
- duration: clip length in seconds

For EACH clip, evaluate these 4 dimensions (score each 1–10):
1. **virality** — How shareable and attention-grabbing is this? Does it have a strong hook or memorable moment?
2. **coherence** — Does it make sense as a standalone clip? Is the story complete and followable?
3. **energy** — Is the pacing engaging? Is there emotional resonance (warmth, humor, excitement)?
4. **completeness** — Does it have a clear start and end? Not cut off mid-sentence?

Then compute a single **overall score** (1–10, one decimal) as a weighted average: virality×0.35 + coherence×0.30 + energy×0.20 + completeness×0.15.

Also write a **summary**: 1 concise English sentence explaining what makes this clip strong or weak.

OUTPUT FORMAT — strict JSON, no markdown:
{
  "clips": [
    {
      "index": 1,
      "score": 8.5,
      "summary": "Strong opening hook with warm customer greeting sets the tone perfectly.",
      "metrics": { "virality": 9, "coherence": 8, "energy": 8, "completeness": 9 }
    }
  ]
}

Evaluate EVERY clip in the input. Do not skip any."""

    user_content = json.dumps(clips_data, ensure_ascii=False, indent=2)

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": user_content},
            ],
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        content = response.choices[0].message.content
        data = json.loads(content)
        result: Dict[int, Dict] = {}
        for item in data.get("clips", []):
            idx = item.get("index")
            if idx is not None:
                result[int(idx)] = {
                    "score": item.get("score"),
                    "summary": item.get("summary", ""),
                    "metrics": item.get("metrics", {}),
                }
        return result
    except Exception as e:
        print(f"Scoring LLM Error: {e}")
        return {}
