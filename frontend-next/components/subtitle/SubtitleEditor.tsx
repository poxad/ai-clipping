"use client";

import { useEffect, useReducer, useState } from "react";
import { styleToPayload } from "@/lib/api";
import type { StylePayload } from "@/lib/types";
import { Slider } from "@/components/ui/slider";
import {
  Type, Palette, Layers, AlignCenter, AlignLeft, AlignRight,
  Bold, Italic, ChevronDown,
} from "lucide-react";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

interface SubtitleStyle {
  previewText: string;
  language: "en" | "id";
  // Font
  font: string;
  bold: boolean;
  italic: boolean;
  textCase: "none" | "uppercase" | "lowercase";
  letterSpacing: number;
  alignment: "left" | "center" | "right";
  // Size & position
  fontSize: number;
  marginV: number;
  // Color
  textColor: string;
  // Outline / stroke
  hasOutline: boolean;
  outlineColor: string;
  outlineWidth: number;
  // Shadow
  hasShadow: boolean;
  shadowSize: number;
  shadowX: number;
  shadowY: number;
  shadowColor: string;
  // Background box
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FONTS = ["Poppins", "Montserrat", "Inter", "Roboto", "Arial", "Impact", "Bebas Neue", "Anton"];
const PRESETS = [
  { label: "Clean White",   s: { textColor: "#ffffff", hasOutline: false, hasShadow: true,  shadowSize: 2, hasBg: false, bold: true  } },
  { label: "Black Outline", s: { textColor: "#ffffff", hasOutline: true,  outlineWidth: 4, hasShadow: false, hasBg: false, bold: true  } },
  { label: "Yellow Bold",   s: { textColor: "#ffe600", hasOutline: true,  outlineWidth: 3, outlineColor: "#000000", hasShadow: false, hasBg: false, bold: true } },
  { label: "Dark Box",      s: { textColor: "#ffffff", hasOutline: false, hasShadow: false, hasBg: true,  bgColor: "#000000", bgOpacity: 65, bold: true } },
  { label: "Neon Green",    s: { textColor: "#00ff88", hasOutline: false, hasShadow: true,  shadowSize: 3, shadowColor: "#004422", hasBg: false, bold: true } },
  { label: "Cinematic",     s: { textColor: "#f5f0e0", hasOutline: false, hasShadow: true,  shadowSize: 4, shadowColor: "#000000", hasBg: true, bgColor: "#000000", bgOpacity: 35, bold: false, italic: false } },
];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Tab({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
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
          <Slider
            value={[value]} min={min} max={max} step={step}
            onValueChange={(v: number[]) => onChange(v[0])}
          />
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
        <div className="relative">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0.5"
            style={{ background: "#f7f6f3", border: "1px solid #e4e1da" }}
          />
        </div>
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

function SelectRow({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <Row label={label}>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg px-3 py-1.5 text-xs pr-7"
          style={{ background: "#ffffff", border: "1px solid #e4e1da", color: "#1c1917", outline: "none" }}
        >
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9e9b94" }} />
      </div>
    </Row>
  );
}

function SectionHead({ label }: { label: string }) {
  return (
    <div className="text-xs font-bold uppercase tracking-wider mb-3 mt-1" style={{ color: "#c4c1bb" }}>{label}</div>
  );
}

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

const PLAY_H = 1920;
const FRAME_H = 432;
const scale = FRAME_H / PLAY_H;

function Preview({ style }: { style: SubtitleStyle }) {
  const rawText = style.previewText;
  const displayText =
    style.textCase === "uppercase" ? rawText.toUpperCase() :
    style.textCase === "lowercase" ? rawText.toLowerCase() : rawText;

  const fontSizePx = Math.max(16 * scale, (style.fontSize / 100) * PLAY_H * scale);
  const shadowPx = style.hasShadow ? style.shadowSize : 0;

  const textShadow = style.hasShadow
    ? `${shadowPx}px ${shadowPx}px 0px ${style.shadowColor}`
    : "none";

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

  const bottomPct = (Math.max(10, (style.marginV / 100) * PLAY_H) * scale / FRAME_H) * 100;

  return (
    <div style={{ width: 243, height: FRAME_H, position: "relative", overflow: "hidden", borderRadius: 8, flexShrink: 0 }}>
      {/* BG gradient simulating video */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #1a1a2e, #16213e, #0f3460)" }} />

      {/* TikTok chrome */}
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

      {/* Subtitle */}
      <div style={{
        position: "absolute", left: 8, right: 8,
        bottom: `${bottomPct}%`,
        display: "flex", flexDirection: "column",
        alignItems: alignMap[style.alignment] as any,
        zIndex: 10, pointerEvents: "none",
      }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          {style.hasBg && (
            <div style={{
              position: "absolute", inset: "-3px 6px",
              background: style.bgColor,
              opacity: style.bgOpacity / 100,
              borderRadius: 3,
              zIndex: 0,
            }} />
          )}
          <span style={{
            position: "relative", zIndex: 1,
            fontFamily: `"${style.font}", sans-serif`,
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

// ---------------------------------------------------------------------------
// Main editor
// ---------------------------------------------------------------------------

type TabKey = "font" | "style" | "position" | "effects";

export function SubtitleEditor({ onStyleChange }: { onStyleChange: (p: StylePayload) => void }) {
  const [s, dispatch] = useReducer(reducer, DEFAULT);
  const [tab, setTab] = useState<TabKey>("font");
  const [open, setOpen] = useState(true);

  function set<K extends keyof SubtitleStyle>(key: K, value: SubtitleStyle[K]) {
    dispatch({ key, value } as Action);
  }

  function applyPreset(preset: typeof PRESETS[0]) {
    Object.entries(preset.s).forEach(([k, v]) => set(k as keyof SubtitleStyle, v as any));
  }

  useEffect(() => {
    onStyleChange(styleToPayload({
      language: s.language,
      font: s.font,
      bold: s.bold,
      italic: s.italic,
      textCase: s.textCase,
      textColor: s.textColor,
      fontSize: s.fontSize,
      letterSpacing: s.letterSpacing,
      alignment: s.alignment,
      marginV: s.marginV,
      hasOutline: s.hasOutline,
      outlineColor: s.outlineColor,
      outlineWidth: s.outlineWidth,
      shadowSize: s.hasShadow ? s.shadowSize : 0,
      shadowX: s.shadowX,
      shadowY: s.shadowY,
      shadowColor: s.shadowColor,
      hasBg: s.hasBg,
      bgColor: s.bgColor,
      bgOpacity: s.bgOpacity,
    }));
  }, [s]);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e4e1da" }}>
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-[#fafaf8]"
        style={{ borderBottom: open ? "1px solid #e4e1da" : "none" }}
      >
        <div className="flex items-center gap-2">
          <Type className="w-4 h-4" style={{ color: "#6d28d9" }} />
          <span className="text-sm font-bold" style={{ color: "#1c1917" }}>Subtitle Style</span>
        </div>
        <ChevronDown
          className="w-4 h-4 transition-transform"
          style={{ color: "#9e9b94", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {open && (
        <div className="flex" style={{ minHeight: 520 }}>
          {/* Preview */}
          <div
            className="flex flex-col items-center gap-4 p-5"
            style={{ background: "#111", borderRight: "1px solid #1a1a1a", width: 280, flexShrink: 0 }}
          >
            <Preview style={s} />

            {/* Preview text input */}
            <input
              value={s.previewText}
              onChange={(e) => set("previewText", e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)",
                color: "#ffffff", outline: "none",
              }}
              placeholder="Preview text…"
            />

            {/* Presets */}
            <div className="w-full">
              <div className="text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>Quick Presets</div>
              <div className="grid grid-cols-2 gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p)}
                    className="px-2 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90 text-left"
                    style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex gap-1 p-2" style={{ borderBottom: "1px solid #e4e1da", background: "#fafaf8" }}>
              <Tab active={tab === "font"}     onClick={() => setTab("font")}     icon={Type}        label="Font"     />
              <Tab active={tab === "style"}    onClick={() => setTab("style")}    icon={Palette}     label="Style"    />
              <Tab active={tab === "position"} onClick={() => setTab("position")} icon={AlignCenter} label="Position" />
              <Tab active={tab === "effects"}  onClick={() => setTab("effects")}  icon={Layers}      label="Effects"  />
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">

              {/* ── FONT ── */}
              {tab === "font" && (
                <>
                  <SectionHead label="Typeface" />
                  <SelectRow label="Font" value={s.font} options={FONTS} onChange={(v) => set("font", v)} />

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

              {/* ── STYLE ── */}
              {tab === "style" && (
                <>
                  <SectionHead label="Text Color" />
                  <ColorRow label="Color" value={s.textColor} onChange={(v) => set("textColor", v)} />

                  <SectionHead label="Outline / Stroke" />
                  <Row label="Enabled">
                    <Toggle on={s.hasOutline} onChange={(v) => set("hasOutline", v)}>
                      {s.hasOutline ? "ON" : "OFF"}
                    </Toggle>
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
                    <Toggle on={s.hasShadow} onChange={(v) => set("hasShadow", v)}>
                      {s.hasShadow ? "ON" : "OFF"}
                    </Toggle>
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
                    <Toggle on={s.hasBg} onChange={(v) => set("hasBg", v)}>
                      {s.hasBg ? "ON" : "OFF"}
                    </Toggle>
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

              {/* ── POSITION ── */}
              {tab === "position" && (
                <>
                  <SectionHead label="Size & Position" />
                  <SliderRow label="Font size" min={2} max={12} step={0.5} value={s.fontSize}
                    onChange={(v) => set("fontSize", v)} display={`${s.fontSize}%`} />
                  <SliderRow label="Bottom" min={2} max={60} step={1} value={s.marginV}
                    onChange={(v) => set("marginV", v)} display={`${s.marginV}%`} />
                </>
              )}

              {/* ── EFFECTS ── */}
              {tab === "effects" && (
                <>
                  <SectionHead label="Quick Presets" />
                  <div className="grid grid-cols-2 gap-2">
                    {PRESETS.map((p) => (
                      <button
                        key={p.label}
                        onClick={() => applyPreset(p)}
                        className="px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left hover:opacity-90"
                        style={{ background: "#f7f6f3", color: "#1c1917", border: "1px solid #e4e1da" }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <SectionHead label="Reset" />
                  <button
                    onClick={() => Object.entries(DEFAULT).forEach(([k, v]) => set(k as keyof SubtitleStyle, v as any))}
                    className="w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{ background: "#f7f6f3", color: "#706d67", border: "1px solid #e4e1da" }}
                  >
                    Reset to defaults
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
