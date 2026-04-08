"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Loader2, Check } from "lucide-react";
import { getWords, rerenderSubtitles, clipName, videoUrl } from "@/lib/api";
import type { WordEntry } from "@/lib/api";
import type { Clip, StylePayload } from "@/lib/types";

interface Props {
  clip: Clip;
  jobId: string;
  style?: StylePayload | null;
  onClose: () => void;
  onSaved: () => void;
}

interface SubtitleLine {
  words: WordEntry[];   // original word entries in this line
  start: number;
  end: number;
  text: string;         // current (possibly edited) text
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 10);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${ms}`;
}

/** Group flat word list into subtitle lines by gap and max word count. */
function groupIntoLines(words: WordEntry[]): SubtitleLine[] {
  const GAP = 0.8;    // seconds gap → new line
  const MAX_WORDS = 7; // max words per line

  const lines: SubtitleLine[] = [];
  let current: WordEntry[] = [];

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const prev = current[current.length - 1];
    const gapTooLarge = prev && (w.start - prev.end) > GAP;
    const lineTooLong = current.length >= MAX_WORDS;

    if (current.length > 0 && (gapTooLarge || lineTooLong)) {
      lines.push({
        words: current,
        start: current[0].start,
        end: current[current.length - 1].end,
        text: current.map((x) => x.word).join(" "),
      });
      current = [];
    }
    current.push(w);
  }
  if (current.length > 0) {
    lines.push({
      words: current,
      start: current[0].start,
      end: current[current.length - 1].end,
      text: current.map((x) => x.word).join(" "),
    });
  }
  return lines;
}

export function SubtitleEditModal({ clip, jobId, style, onClose, onSaved }: Props) {
  const name = clipName(clip);
  const url = videoUrl(jobId, name);

  const [words, setWords] = useState<WordEntry[] | null>(null);
  const [lines, setLines] = useState<SubtitleLine[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    getWords(jobId, name)
      .then((w) => {
        setWords(w);
        setLines(groupIntoLines(w));
      })
      .catch((e) => setLoadError(e.message));
  }, [jobId, name]);

  // Sync active line with video time
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    function onTimeUpdate() {
      const t = v!.currentTime;
      const idx = lines.findIndex((l) => t >= l.start && t <= l.end);
      if (idx !== -1 && idx !== activeIdx) {
        setActiveIdx(idx);
        lineRefs.current[idx]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
    v.addEventListener("timeupdate", onTimeUpdate);
    return () => v.removeEventListener("timeupdate", onTimeUpdate);
  }, [lines, activeIdx]);

  function seekTo(start: number, idx: number) {
    if (videoRef.current) {
      videoRef.current.currentTime = start;
      videoRef.current.play().catch(() => {});
    }
    setActiveIdx(idx);
  }

  function updateLine(idx: number, text: string) {
    setLines((prev) => prev.map((l, i) => i === idx ? { ...l, text } : l));
  }

  const isDirty = words !== null && lines.some(
    (l) => l.text !== l.words.map((w) => w.word).join(" ")
  );

  async function handleSave() {
    if (!words || !style) return;
    setSaving(true);
    setSaveError(null);
    try {
      // Rebuild flat word overrides from edited lines
      const overrides: WordEntry[] = [];
      for (const line of lines) {
        const tokens = line.text.trim().split(/\s+/).filter(Boolean);
        line.words.forEach((w, i) => {
          overrides.push({ ...w, word: tokens[i] ?? w.word });
        });
      }
      await rerenderSubtitles(jobId, name, style, overrides);
      onSaved();
      onClose();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  }

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative flex flex-col rounded-2xl overflow-hidden"
        style={{
          width: "min(900px, 95vw)",
          height: "min(620px, 92vh)",
          background: "#ffffff",
          border: "1px solid #e4e1da",
          boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
          style={{ borderBottom: "1px solid #e4e1da" }}
        >
          <div>
            <span className="text-sm font-semibold" style={{ color: "#1c1917" }}>Edit Subtitles</span>
            <span className="text-xs ml-2" style={{ color: "#9e9b94" }}>
              Click a line to seek · Edit text inline
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f0ede8] transition-colors"
            style={{ color: "#9e9b94" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — two columns */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left — video */}
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{ width: 220, background: "#111", borderRight: "1px solid #e4e1da" }}
          >
            <video
              ref={videoRef}
              src={url}
              controls
              playsInline
              loop
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          {/* Right — timeline */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {loadError && (
              <div className="flex-1 flex items-center justify-center text-sm" style={{ color: "#dc2626" }}>
                {loadError}
              </div>
            )}

            {!words && !loadError && (
              <div className="flex-1 flex items-center justify-center gap-2" style={{ color: "#9e9b94" }}>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading transcript…</span>
              </div>
            )}

            {words && (
              <div className="flex-1 overflow-y-auto">
                {lines.map((line, idx) => {
                  const original = line.words.map((w) => w.word).join(" ");
                  const edited = line.text !== original;
                  const isActive = activeIdx === idx;

                  return (
                    <div
                      key={idx}
                      ref={(el) => { lineRefs.current[idx] = el; }}
                      className="flex gap-3 px-4 py-2.5 transition-all cursor-pointer"
                      style={{
                        borderBottom: "1px solid #f0ede8",
                        background: isActive
                          ? "rgba(109,40,217,0.05)"
                          : "transparent",
                        borderLeft: `3px solid ${isActive ? "#6d28d9" : "transparent"}`,
                      }}
                      onClick={() => seekTo(line.start, idx)}
                    >
                      {/* Timestamp */}
                      <div className="flex-shrink-0 pt-1" style={{ width: 90 }}>
                        <span
                          className="text-xs font-mono font-medium"
                          style={{ color: isActive ? "#6d28d9" : "#9e9b94" }}
                        >
                          {fmt(line.start)}
                        </span>
                        <span className="text-xs font-mono" style={{ color: "#c4c1bb" }}> – </span>
                        <span className="text-xs font-mono" style={{ color: "#9e9b94" }}>
                          {fmt(line.end)}
                        </span>
                      </div>

                      {/* Editable text */}
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={line.text}
                          onChange={(e) => updateLine(idx, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full text-sm outline-none bg-transparent rounded px-1.5 py-0.5 transition-all"
                          style={{
                            color: "#1c1917",
                            border: `1px solid ${edited ? "rgba(109,40,217,0.4)" : "transparent"}`,
                            background: edited ? "rgba(109,40,217,0.04)" : "transparent",
                            fontFamily: "inherit",
                          }}
                          spellCheck={false}
                        />
                      </div>

                      {/* Edited indicator */}
                      {edited && (
                        <div className="flex-shrink-0 pt-1.5">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: "#6d28d9" }}
                            title="Edited"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
          style={{ borderTop: "1px solid #e4e1da" }}
        >
          {saveError ? (
            <span className="text-xs" style={{ color: "#dc2626" }}>⚠ {saveError}</span>
          ) : (
            <span className="text-xs" style={{ color: "#9e9b94" }}>
              {words ? `${lines.length} lines · ${words.length} words` : ""}
              {isDirty && <span style={{ color: "#6d28d9" }}> · edited</span>}
            </span>
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: "#f7f6f3", color: "#706d67", border: "1px solid #e4e1da" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !words || !style || !isDirty}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all"
              style={{ background: "linear-gradient(135deg, #6d28d9, #7c3aed)", color: "white" }}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {saving ? "Saving…" : "Save & Re-render"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
