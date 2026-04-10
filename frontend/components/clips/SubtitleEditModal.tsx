"use client";

import {
  useEffect, useRef, useState, useReducer,
} from "react";
import {
  X, Loader2, Check,
  Type, Palette, Layers, AlignCenter, AlignLeft, AlignRight,
  Bold, Italic, Captions, Paintbrush,
} from "lucide-react";
import { getWords, rerenderSubtitles, clipName, videoUrl, styleToPayload } from "@/lib/api";
import type { WordEntry } from "@/lib/api";
import type { Clip } from "@/lib/types";
import { Slider } from "@/components/ui/slider";

// ─────────────────────────────────────────────────────────────────────────────
// Subtitle style state (mirrors SubtitleEditor)
// ─────────────────────────────────────────────────────────────────────────────

const FONT_CSS: Record<string, string> = {
  "Poppins":    "var(--font-poppins)",
  "Montserrat": "var(--font-montserrat)",
  "Inter":      "var(--font-inter)",
  "Roboto":     "var(--font-roboto)",
  "Arial":      "Arial, sans-serif",
  "Impact":     "Impact, fantasy",
  "Bebas Neue": "var(--font-bebas-neue)",
  "Anton":      "var(--font-anton)",
};

const FONTS = ["Poppins", "Montserrat", "Inter", "Roboto", "Arial", "Impact", "Bebas Neue", "Anton"];

interface SubtitleStyle {
  previewText: string;
  language: "en" | "id";
  font: string;
  bold: boolean;
  italic: boolean;
  textCase: "none" | "uppercase" | "lowercase";
  letterSpacing: number;
  alignment: "left" | "center" | "right";
  fontSize: number;
  marginV: number;
  textColor: string;
  hasOutline: boolean;
  outlineColor: string;
  outlineWidth: number;
  hasShadow: boolean;
  shadowSize: number;
  shadowX: number;
  shadowY: number;
  shadowColor: string;
  hasBg: boolean;
  bgColor: string;
  bgOpacity: number;
}

const DEFAULT: SubtitleStyle = {
  previewText: "this is a sample subtitle",
  language: "id",
  font: "Poppins",
  bold: true,
  italic: false,
  textCase: "lowercase",
  letterSpacing: 0,
  alignment: "center",
  fontSize: 4.0,
  marginV: 27,
  textColor: "#ffffff",
  hasOutline: false,
  outlineColor: "#000000",
  outlineWidth: 3,
  hasShadow: true,
  shadowSize: 4,
  shadowX: 0,
  shadowY: 0,
  shadowColor: "#000000",
  hasBg: false,
  bgColor: "#000000",
  bgOpacity: 60,
};

type Action = { [K in keyof SubtitleStyle]: { key: K; value: SubtitleStyle[K] } }[keyof SubtitleStyle];
function reducer(s: SubtitleStyle, a: Action): SubtitleStyle { return { ...s, [a.key]: a.value }; }

const TEMPLATES: { label: string; s: Partial<SubtitleStyle> }[] = [
  { label: "Clean White",   s: { textColor: "#ffffff", hasOutline: false, hasShadow: true,  shadowSize: 2, hasBg: false, bold: true, font: "Poppins" } },
  { label: "Black Outline", s: { textColor: "#ffffff", hasOutline: true,  outlineWidth: 4, hasShadow: false, hasBg: false, bold: true, font: "Montserrat" } },
  { label: "Yellow Bold",   s: { textColor: "#ffe600", hasOutline: true,  outlineWidth: 3, outlineColor: "#000000", hasShadow: false, hasBg: false, bold: true, font: "Impact" } },
  { label: "Dark Box",      s: { textColor: "#ffffff", hasOutline: false, hasShadow: false, hasBg: true, bgColor: "#000000", bgOpacity: 65, bold: true, font: "Poppins" } },
  { label: "Neon Green",    s: { textColor: "#00ff88", hasOutline: false, hasShadow: true,  shadowSize: 3, shadowColor: "#004422", hasBg: false, bold: true, font: "Anton" } },
  { label: "Cinematic",     s: { textColor: "#f5f0e0", hasOutline: false, hasShadow: true,  shadowSize: 4, shadowColor: "#000000", hasBg: true, bgColor: "#000000", bgOpacity: 35, bold: false, italic: false, font: "Montserrat" } },
];

// ─────────────────────────────────────────────────────────────────────────────
// Phone preview
// ─────────────────────────────────────────────────────────────────────────────

const PLAY_H = 1920;
const FRAME_H = 432;
const previewScale = FRAME_H / PLAY_H;

function PhonePreview({ style }: { style: SubtitleStyle }) {
  const rawText = style.previewText;
  const displayText =
    style.textCase === "uppercase" ? rawText.toUpperCase() :
    style.textCase === "lowercase" ? rawText.toLowerCase() : rawText;

  const fontSizePx = Math.max(16 * previewScale, (style.fontSize / 100) * PLAY_H * previewScale);
  const shadowPx = style.hasShadow ? style.shadowSize : 0;
  const textShadow = style.hasShadow ? `${shadowPx}px ${shadowPx}px 0px ${style.shadowColor}` : "none";
  const outline = style.hasOutline
    ? (() => {
        const n = style.outlineWidth;
        const c = style.outlineColor;
        const offsets: string[] = [];
        for (let x = -n; x <= n; x++)
          for (let y = -n; y <= n; y++)
            if (x !== 0 || y !== 0) offsets.push(`${x}px ${y}px 0 ${c}`);
        return offsets.join(", ");
      })()
    : "none";

  const finalShadow = [textShadow !== "none" ? textShadow : null, outline !== "none" ? outline : null]
    .filter(Boolean).join(", ") || "none";

  const alignMap = { left: "flex-start", center: "center", right: "flex-end" };
  const bottomPct = (Math.max(10, (style.marginV / 100) * PLAY_H) * previewScale / FRAME_H) * 100;

  return (
    <div style={{ width: 243, height: FRAME_H, position: "relative", overflow: "hidden", borderRadius: 12, flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #1a1a2e, #16213e, #0f3460)" }} />
      <span style={{ position: "absolute", top: 8, left: 8, fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", zIndex: 5 }}>9:16</span>
      <div style={{ position: "absolute", inset: 0, zIndex: 5, pointerEvents: "none" }}>
        <div style={{ position: "absolute", right: 8, bottom: 80, display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
          {[36, 36, 36, 28].map((size, i) => (
            <div key={i} style={{ width: size, height: size, borderRadius: "50%", background: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)" }} />
          ))}
        </div>
        <div style={{ position: "absolute", left: 10, bottom: 18, right: 56, display: "flex", flexDirection: "column", gap: 7 }}>
          <div style={{ width: "40%", height: 13, background: "rgba(255,255,255,0.7)", borderRadius: 4 }} />
          <div style={{ width: "80%", height: 9, background: "rgba(255,255,255,0.35)", borderRadius: 4 }} />
          <div style={{ width: "60%", height: 9, background: "rgba(255,255,255,0.35)", borderRadius: 4 }} />
        </div>
      </div>
      <div style={{
        position: "absolute", left: 8, right: 8,
        bottom: `${bottomPct}%`,
        display: "flex", flexDirection: "column",
        alignItems: alignMap[style.alignment] as React.CSSProperties["alignItems"],
        zIndex: 10, pointerEvents: "none",
      }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          {style.hasBg && (
            <div style={{
              position: "absolute", inset: "-3px 6px",
              background: style.bgColor,
              opacity: style.bgOpacity / 100,
              borderRadius: 3, zIndex: 0,
            }} />
          )}
          <span style={{
            position: "relative", zIndex: 1,
            fontFamily: FONT_CSS[style.font] || `"${style.font}", sans-serif`,
            fontWeight: style.bold ? 800 : 400,
            fontSize: fontSizePx,
            color: style.textColor,
            fontStyle: style.italic ? "italic" : "normal",
            letterSpacing: style.letterSpacing * 0.5,
            whiteSpace: "pre-wrap",
            textAlign: style.alignment,
            lineHeight: 1.25,
            textShadow: finalShadow,
            display: "block",
          }}>
            {displayText}
          </span>
        </div>
      </div>
    </div>
  );
}

function MiniTemplateCard({
  template,
  isSelected,
  onClick,
}: {
  template: typeof TEMPLATES[0];
  isSelected: boolean;
  onClick: () => void;
}) {
  const mergedStyle: SubtitleStyle = { ...DEFAULT, ...template.s, previewText: "Aa" };
  const shadowPx = mergedStyle.hasShadow ? mergedStyle.shadowSize : 0;
  const textShadow = mergedStyle.hasShadow ? `${shadowPx}px ${shadowPx}px 0px ${mergedStyle.shadowColor}` : "none";
  let outline = "none";
  if (mergedStyle.hasOutline) {
    const n = Math.max(1, Math.floor(mergedStyle.outlineWidth / 1.5));
    const c = mergedStyle.outlineColor;
    const offsets: string[] = [];
    for (let x = -n; x <= n; x++)
      for (let y = -n; y <= n; y++)
        if (x !== 0 || y !== 0) offsets.push(`${x}px ${y}px 0 ${c}`);
    outline = offsets.join(", ");
  }
  const finalShadow = [textShadow !== "none" ? textShadow : null, outline !== "none" ? outline : null]
    .filter(Boolean).join(", ") || "none";

  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <div style={{
        width: 72,
        height: 56,
        overflow: "hidden",
        borderRadius: 8,
        background: "#1c1917",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: `2px solid ${isSelected ? "#6d28d9" : "rgba(255,255,255,0.1)"}`,
        boxShadow: isSelected
          ? "0 0 0 3px rgba(109,40,217,0.35)"
          : "0 2px 8px rgba(0,0,0,0.4)",
        position: "relative",
        transition: "all 0.15s ease",
      }}>
        {mergedStyle.hasBg && (
          <div style={{
            position: "absolute",
            inset: "8px 12px",
            background: mergedStyle.bgColor,
            opacity: mergedStyle.bgOpacity / 100,
            borderRadius: 3,
            zIndex: 0,
          }} />
        )}
        <span style={{
          position: "relative",
          zIndex: 1,
          fontFamily: FONT_CSS[mergedStyle.font] || `"${mergedStyle.font}", sans-serif`,
          fontWeight: mergedStyle.bold ? 800 : 400,
          fontSize: 24,
          color: mergedStyle.textColor,
          fontStyle: mergedStyle.italic ? "italic" : "normal",
          letterSpacing: mergedStyle.letterSpacing * 0.25,
          textShadow: finalShadow,
          lineHeight: 1,
        }}>
          Aa
        </span>
      </div>
      <span style={{
        fontSize: 10,
        fontWeight: isSelected ? 700 : 500,
        color: isSelected ? "#6d28d9" : "#9e9b94",
        textAlign: "center",
        maxWidth: 72 + 4,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        lineHeight: 1,
      }}>
        {template.label}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Style editor sub-controls
// ─────────────────────────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-20 flex-shrink-0" style={{ color: "#9e9b94" }}>{label}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function SliderRow({ label, min, max, step, value, onChange, display }: {
  label: string; min: number; max: number; step: number;
  value: number; onChange: (v: number) => void; display: string;
}) {
  return (
    <Row label={label}>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v: number[]) => onChange(v[0])} />
        </div>
        <span className="text-xs font-bold tabular-nums w-10 text-right" style={{ color: "#706d67" }}>{display}</span>
      </div>
    </Row>
  );
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Row label={label}>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0.5"
          style={{ background: "#f7f6f3", border: "1px solid #e4e1da" }}
        />
        <span className="text-xs font-mono" style={{ color: "#9e9b94" }}>{value.toUpperCase()}</span>
      </div>
    </Row>
  );
}

function Toggle({ on, onChange, children }: { on: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
      style={{
        background: on ? "rgba(109,40,217,0.1)" : "#f7f6f3",
        color: on ? "#6d28d9" : "#9e9b94",
        border: `1px solid ${on ? "rgba(109,40,217,0.3)" : "#e4e1da"}`,
      }}
    >
      {children}
    </button>
  );
}

function SectionHead({ label }: { label: string }) {
  return <div className="text-xs font-bold uppercase tracking-wider mb-3 mt-1" style={{ color: "#b0aba3" }}>{label}</div>;
}

function StyleDetailTab({ active, onClick, icon: Icon, label }: {
  active: boolean; onClick: () => void; icon: React.ElementType; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all flex-1"
      style={{
        background: active ? "#ffffff" : "transparent",
        color: active ? "#6d28d9" : "#9e9b94",
        boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
        border: active ? "1px solid #e4e1da" : "1px solid transparent",
      }}
    >
      <Icon className="w-4 h-4" />
      <span className="text-xs font-semibold">{label}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subtitle line types
// ─────────────────────────────────────────────────────────────────────────────

interface SubtitleLine {
  words: WordEntry[];
  start: number;
  end: number;
  text: string;
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 10);
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${ms}`;
}

function groupIntoLines(words: WordEntry[]): SubtitleLine[] {
  const GAP = 0.8;
  const MAX_WORDS = 7;
  const lines: SubtitleLine[] = [];
  let current: WordEntry[] = [];

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const prev = current[current.length - 1];
    const gapTooLarge = prev && (w.start - prev.end) > GAP;
    const lineTooLong = current.length >= MAX_WORDS;

    if (current.length > 0 && (gapTooLarge || lineTooLong)) {
      lines.push({ words: current, start: current[0].start, end: current[current.length - 1].end, text: current.map((x) => x.word).join(" ") });
      current = [];
    }
    current.push(w);
  }
  if (current.length > 0) {
    lines.push({ words: current, start: current[0].start, end: current[current.length - 1].end, text: current.map((x) => x.word).join(" ") });
  }
  return lines;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main modal
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  clip: Clip;
  jobId: string;
  onClose: () => void;
  onSaved: () => void;
}

type MainTab = "subtitles" | "style";
type StyleTab = "font" | "style" | "position" | "effects";

export function SubtitleEditModal({ clip, jobId, onClose, onSaved }: Props) {
  const name = clipName(clip);
  const url = videoUrl(jobId, name);

  // ── Subtitle text state ──
  const [words, setWords] = useState<WordEntry[] | null>(null);
  const [lines, setLines] = useState<SubtitleLine[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // ── Style state ──
  const [s, dispatch] = useReducer(reducer, DEFAULT);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [styleTab, setStyleTab] = useState<StyleTab>("font");

  // ── Save state ──
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── UI state ──
  const [mainTab, setMainTab] = useState<MainTab>("subtitles");

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  function set<K extends keyof SubtitleStyle>(key: K, value: SubtitleStyle[K]) {
    dispatch({ key, value } as Action);
  }

  function applyTemplate(idx: number) {
    setSelectedTemplate(idx);
    Object.entries(TEMPLATES[idx].s).forEach(([k, v]) => set(k as keyof SubtitleStyle, v as never));
  }

  // Load transcript
  useEffect(() => {
    getWords(jobId, name)
      .then((w) => { setWords(w); setLines(groupIntoLines(w)); })
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

  const isDirty = words !== null && lines.some((l) => l.text !== l.words.map((w) => w.word).join(" "));

  const stylePayload = styleToPayload({
    language: s.language, font: s.font, bold: s.bold, italic: s.italic,
    textCase: s.textCase, textColor: s.textColor, fontSize: s.fontSize,
    letterSpacing: s.letterSpacing, alignment: s.alignment, marginV: s.marginV,
    hasOutline: s.hasOutline, outlineColor: s.outlineColor, outlineWidth: s.outlineWidth,
    shadowSize: s.hasShadow ? s.shadowSize : 0, shadowX: s.shadowX, shadowY: s.shadowY,
    shadowColor: s.shadowColor, hasBg: s.hasBg, bgColor: s.bgColor, bgOpacity: s.bgOpacity,
  });

  async function handleSave() {
    if (!words) return;
    setSaving(true);
    setSaveError(null);
    try {
      const overrides: WordEntry[] = [];
      for (const line of lines) {
        const tokens = line.text.trim().split(/\s+/).filter(Boolean);
        line.words.forEach((w, i) => { overrides.push({ ...w, word: tokens[i] ?? w.word }); });
      }
      await rerenderSubtitles(jobId, name, stylePayload, overrides);
      onSaved();
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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="relative flex flex-col overflow-hidden rounded-2xl"
        style={{
          width: "min(1280px, 100vw)",
          height: "min(840px, 100vh)",
          background: "#ffffff",
          border: "1px solid #e4e1da",
          boxShadow: "0 32px 100px rgba(0,0,0,0.3)",
        }}
      >

        {/* ── Header ── */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 px-3 py-3.5 sm:px-5 flex-shrink-0"
          style={{ borderBottom: "1px solid #e4e1da", background: "#fafaf8" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: "#1c1917" }}>
              Clip #{String(clip.index).padStart(3, "0")}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#f0ede8", color: "#9e9b94" }}>
              Edit
            </span>
          </div>

          {/* Main tab pills — centred */}
          <div className="flex max-w-full items-center gap-1 overflow-x-auto p-1 rounded-xl no-scrollbar" style={{ background: "#f0ede8" }}>
            <button
              onClick={() => setMainTab("subtitles")}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: mainTab === "subtitles" ? "#ffffff" : "transparent",
                color: mainTab === "subtitles" ? "#1c1917" : "#9e9b94",
                boxShadow: mainTab === "subtitles" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <Captions className="w-3.5 h-3.5" />
              Subtitle Edit
            </button>
            <button
              onClick={() => setMainTab("style")}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: mainTab === "style" ? "#ffffff" : "transparent",
                color: mainTab === "style" ? "#1c1917" : "#9e9b94",
                boxShadow: mainTab === "style" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              Style Edit
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-[#f0ede8]"
            style={{ color: "#9e9b94" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">

          {/* Left — video player */}
          <div
            className="flex flex-shrink-0 flex-col items-center justify-center gap-4 p-4 sm:p-5 lg:border-r"
            style={{ width: "100%", maxWidth: 340, background: "#111827", borderColor: "#1e1e2e" }}
          >
            <video
              ref={videoRef}
              src={url}
              controls
              playsInline
              loop
              style={{ width: "100%", borderRadius: 10, display: "block", background: "#000" }}
            />
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textAlign: "center", lineHeight: 1.5 }}>
              Click a subtitle line to jump to that moment
            </p>
          </div>

          {/* Right — tab content */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* ── SUBTITLE EDIT tab ── */}
            {mainTab === "subtitles" && (
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
                  <>
                    <div className="px-5 py-3 flex-shrink-0 border-b" style={{ borderColor: "#f0ede8", background: "#fafaf8" }}>
                      <p className="text-xs" style={{ color: "#9e9b94" }}>
                        Click a line to seek the video · Edit any text inline · Changes apply on save
                      </p>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {lines.map((line, idx) => {
                        const original = line.words.map((w) => w.word).join(" ");
                        const edited = line.text !== original;
                        const isActive = activeIdx === idx;
                        return (
                          <div
                            key={idx}
                            ref={(el) => { lineRefs.current[idx] = el; }}
                            className="flex gap-3 px-5 py-3 transition-all cursor-pointer"
                            style={{
                              borderBottom: "1px solid #f5f3f0",
                              background: isActive ? "rgba(109,40,217,0.04)" : "transparent",
                              borderLeft: `3px solid ${isActive ? "#6d28d9" : "transparent"}`,
                            }}
                            onClick={() => seekTo(line.start, idx)}
                          >
                            <div className="flex-shrink-0 pt-1" style={{ width: 90 }}>
                              <span className="text-xs font-mono font-medium" style={{ color: isActive ? "#6d28d9" : "#9e9b94" }}>
                                {fmt(line.start)}
                              </span>
                              <span className="text-xs font-mono" style={{ color: "#c4c1bb" }}> – </span>
                              <span className="text-xs font-mono" style={{ color: "#9e9b94" }}>{fmt(line.end)}</span>
                            </div>
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
                                }}
                                spellCheck={false}
                              />
                            </div>
                            {edited && (
                              <div className="flex-shrink-0 pt-2">
                                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#6d28d9" }} title="Edited" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── STYLE EDIT tab ── */}
            {mainTab === "style" && (
              <div className="flex flex-1 flex-col overflow-hidden xl:flex-row">

                {/* Style controls */}
                <div className="flex flex-1 flex-col overflow-hidden xl:border-r" style={{ borderColor: "#f0ede8" }}>

                  {/* Template gallery */}
                  <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid #e4e1da", background: "#fafaf8", flexShrink: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9e9b94", marginBottom: 10 }}>
                      Templates
                    </div>
                    <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 6 }} className="no-scrollbar">
                      {TEMPLATES.map((t, i) => (
                        <MiniTemplateCard
                          key={t.label}
                          template={t}
                          isSelected={selectedTemplate === i}
                          onClick={() => applyTemplate(i)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Font picker */}
                  <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid #e4e1da", background: "#fafaf8", flexShrink: 0 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9e9b94", marginBottom: 8 }}>
                      Font
                    </div>
                    <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }} className="no-scrollbar">
                      {FONTS.map((font) => {
                        const isActive = s.font === font;
                        return (
                          <button
                            key={font}
                            onClick={() => set("font", font)}
                            style={{
                              flexShrink: 0,
                              padding: "6px 14px",
                              borderRadius: 20,
                              fontSize: 13,
                              fontFamily: FONT_CSS[font] || `"${font}", sans-serif`,
                              fontWeight: 600,
                              background: isActive ? "rgba(109,40,217,0.1)" : "#f0ede8",
                              color: isActive ? "#6d28d9" : "#706d67",
                              border: `1.5px solid ${isActive ? "rgba(109,40,217,0.4)" : "#e4e1da"}`,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {font}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Style detail tabs */}
                  <div className="flex gap-1 p-2 flex-shrink-0" style={{ borderBottom: "1px solid #e4e1da", background: "#fafaf8" }}>
                    <StyleDetailTab active={styleTab === "font"}     onClick={() => setStyleTab("font")}     icon={Type}        label="Font"     />
                    <StyleDetailTab active={styleTab === "style"}    onClick={() => setStyleTab("style")}    icon={Palette}     label="Style"    />
                    <StyleDetailTab active={styleTab === "position"} onClick={() => setStyleTab("position")} icon={AlignCenter} label="Position" />
                    <StyleDetailTab active={styleTab === "effects"}  onClick={() => setStyleTab("effects")}  icon={Layers}      label="Effects"  />
                  </div>

                  {/* Tab content */}
                  <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">

                    {styleTab === "font" && (
                      <>
                        <SectionHead label="Style" />
                        <Row label="Weight">
                          <div className="flex gap-2">
                            <Toggle on={s.bold} onChange={(v) => set("bold", v)}>
                              <Bold className="w-3.5 h-3.5 inline mr-1" />Bold
                            </Toggle>
                            <Toggle on={s.italic} onChange={(v) => set("italic", v)}>
                              <Italic className="w-3.5 h-3.5 inline mr-1" />Italic
                            </Toggle>
                          </div>
                        </Row>
                        <Row label="Case">
                          <div className="flex gap-1">
                            {(["none", "uppercase", "lowercase"] as const).map((c) => (
                              <button
                                key={c}
                                onClick={() => set("textCase", c)}
                                className="px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                                style={{
                                  background: s.textCase === c ? "rgba(109,40,217,0.1)" : "#f7f6f3",
                                  color: s.textCase === c ? "#6d28d9" : "#9e9b94",
                                  border: `1px solid ${s.textCase === c ? "rgba(109,40,217,0.3)" : "#e4e1da"}`,
                                }}
                              >
                                {c === "none" ? "Aa" : c === "uppercase" ? "AA" : "aa"}
                              </button>
                            ))}
                          </div>
                        </Row>
                        <Row label="Align">
                          <div className="flex gap-1">
                            {([["left", AlignLeft], ["center", AlignCenter], ["right", AlignRight]] as const).map(([a, Icon]) => (
                              <button
                                key={a}
                                onClick={() => set("alignment", a)}
                                className="p-1.5 rounded-lg transition-all"
                                style={{
                                  background: s.alignment === a ? "rgba(109,40,217,0.1)" : "#f7f6f3",
                                  color: s.alignment === a ? "#6d28d9" : "#9e9b94",
                                  border: `1px solid ${s.alignment === a ? "rgba(109,40,217,0.3)" : "#e4e1da"}`,
                                }}
                              >
                                <Icon className="w-4 h-4" />
                              </button>
                            ))}
                          </div>
                        </Row>
                        <SectionHead label="Spacing" />
                        <SliderRow label="Letter" min={-5} max={20} step={0.5} value={s.letterSpacing}
                          onChange={(v) => set("letterSpacing", v)} display={`${s.letterSpacing}`} />
                      </>
                    )}

                    {styleTab === "style" && (
                      <>
                        <SectionHead label="Text Color" />
                        <ColorRow label="Color" value={s.textColor} onChange={(v) => set("textColor", v)} />

                        <SectionHead label="Outline / Stroke" />
                        <Row label="Enabled">
                          <Toggle on={s.hasOutline} onChange={(v) => set("hasOutline", v)}>{s.hasOutline ? "ON" : "OFF"}</Toggle>
                        </Row>
                        {s.hasOutline && (
                          <>
                            <ColorRow label="Color" value={s.outlineColor} onChange={(v) => set("outlineColor", v)} />
                            <SliderRow label="Width" min={1} max={10} step={0.5} value={s.outlineWidth}
                              onChange={(v) => set("outlineWidth", v)} display={`${s.outlineWidth}px`} />
                          </>
                        )}

                        <SectionHead label="Drop Shadow" />
                        <Row label="Enabled">
                          <Toggle on={s.hasShadow} onChange={(v) => set("hasShadow", v)}>{s.hasShadow ? "ON" : "OFF"}</Toggle>
                        </Row>
                        {s.hasShadow && (
                          <>
                            <ColorRow label="Color" value={s.shadowColor} onChange={(v) => set("shadowColor", v)} />
                            <SliderRow label="Distance" min={0} max={20} step={1} value={s.shadowSize}
                              onChange={(v) => set("shadowSize", v)} display={`${s.shadowSize}px`} />
                          </>
                        )}

                        <SectionHead label="Background Box" />
                        <Row label="Enabled">
                          <Toggle on={s.hasBg} onChange={(v) => set("hasBg", v)}>{s.hasBg ? "ON" : "OFF"}</Toggle>
                        </Row>
                        {s.hasBg && (
                          <>
                            <ColorRow label="Color" value={s.bgColor} onChange={(v) => set("bgColor", v)} />
                            <SliderRow label="Opacity" min={10} max={100} step={5} value={s.bgOpacity}
                              onChange={(v) => set("bgOpacity", v)} display={`${s.bgOpacity}%`} />
                          </>
                        )}
                      </>
                    )}

                    {styleTab === "position" && (
                      <>
                        <SectionHead label="Size & Position" />
                        <SliderRow label="Font size" min={2} max={12} step={0.5} value={s.fontSize}
                          onChange={(v) => set("fontSize", v)} display={`${s.fontSize}%`} />
                        <SliderRow label="Bottom" min={2} max={60} step={1} value={s.marginV}
                          onChange={(v) => set("marginV", v)} display={`${s.marginV}%`} />
                      </>
                    )}

                    {styleTab === "effects" && (
                      <>
                        <SectionHead label="Reset" />
                        <button
                          onClick={() => {
                            Object.entries(DEFAULT).forEach(([k, v]) => set(k as keyof SubtitleStyle, v as never));
                            setSelectedTemplate(0);
                          }}
                          className="w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                          style={{ background: "#f7f6f3", color: "#706d67", border: "1px solid #e4e1da" }}
                        >
                          Reset to defaults
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Phone preview panel */}
                <div
                  className="flex flex-shrink-0 flex-col items-center justify-start gap-4 border-t p-4 sm:p-5 xl:w-[300px] xl:border-l xl:border-t-0"
                  style={{ background: "#fafaf8", borderColor: "#e4e1da", overflowY: "auto" }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9e9b94", alignSelf: "flex-start" }}>
                    Live Preview
                  </div>
                  <PhonePreview style={s} />
                  <input
                    value={s.previewText}
                    onChange={(e) => set("previewText", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg text-xs"
                    style={{ background: "#ffffff", border: "1px solid #e4e1da", color: "#1c1917", outline: "none" }}
                    placeholder="Preview text…"
                  />
                  <p style={{ fontSize: 10, color: "#c4c1bb", textAlign: "center", lineHeight: 1.6 }}>
                    Style changes apply to all subtitles when you save.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="flex flex-col items-start justify-between gap-3 px-3 py-3.5 sm:flex-row sm:items-center sm:px-5 flex-shrink-0"
          style={{ borderTop: "1px solid #e4e1da", background: "#fafaf8" }}
        >
          {saveError ? (
            <span className="text-xs" style={{ color: "#dc2626" }}>⚠ {saveError}</span>
          ) : (
            <span className="text-xs" style={{ color: "#9e9b94" }}>
              {words ? `${lines.length} lines · ${words.length} words` : "Loading…"}
              {isDirty && <span style={{ color: "#6d28d9" }}> · text edited</span>}
            </span>
          )}
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: "#f7f6f3", color: "#706d67", border: "1px solid #e4e1da" }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !words}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 transition-all"
              style={{ background: "linear-gradient(135deg, #6d28d9, #7c3aed)", color: "white", boxShadow: "0 2px 12px rgba(109,40,217,0.3)" }}
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
