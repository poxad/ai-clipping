"use client";

import { useState } from "react";
import { Download, Sparkles, Star, RotateCcw } from "lucide-react";
import { ClipCard } from "./ClipCard";
import { SubtitleEditModal } from "./SubtitleEditModal";
import { downloadAllUrl, rerenderSubtitles, clipName } from "@/lib/api";
import type { Clip, StylePayload } from "@/lib/types";

interface Props {
  clips: Clip[];
  jobId: string;
  onReset: () => void;
  onSchedule?: (clip: Clip) => void;
  style?: StylePayload | null;
}

export function ClipsGrid({ clips, jobId, onReset, onSchedule, style }: Props) {
  const [sortByScore, setSortByScore] = useState(true);
  const [restyleState, setRestyleState] = useState<"idle" | "loading" | "done">("idle");
  const [restyleError, setRestyleError] = useState<string | null>(null);
  const [cacheBuster, setCacheBuster] = useState("");
  const [editClip, setEditClip] = useState<Clip | null>(null);

  const hasScores = clips.some((c) => c.score != null);

  const displayed = sortByScore
    ? [...clips].sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
    : clips;

  async function handleRestyle() {
    if (!style) return;
    setRestyleState("loading");
    setRestyleError(null);
    try {
      await Promise.all(clips.map((clip) => rerenderSubtitles(jobId, clipName(clip), style)));
      setCacheBuster(`?v=${Date.now()}`);
      setRestyleState("done");
    } catch (e: unknown) {
      setRestyleError(e instanceof Error ? e.message : String(e));
      setRestyleState("idle");
    }
  }

  return (
    <div>
      {/* Header */}
      <div
        className="flex items-start justify-between gap-4 mb-5 p-4 rounded-2xl"
        style={{ background: "#ffffff", border: "1px solid #e4e1da", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold" style={{ color: "#1c1917" }}>
              {clips.length} Clip{clips.length !== 1 ? "s" : ""} Ready
            </h2>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.2)" }}
            >
              ✓ Done
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: "#9e9b94" }}>
            Hover to preview · Click to fullscreen · Download individually or all at once
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {hasScores && (
            <button
              onClick={() => setSortByScore((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: sortByScore ? "rgba(109,40,217,0.08)" : "#f7f6f3",
                border: `1px solid ${sortByScore ? "rgba(109,40,217,0.3)" : "#e4e1da"}`,
                color: sortByScore ? "#6d28d9" : "#706d67",
              }}
            >
              <Star className="w-3.5 h-3.5" />
              {sortByScore ? "Sorted by Score" : "Sort by Score"}
            </button>
          )}
          {style && (
            <button
              onClick={handleRestyle}
              disabled={restyleState === "loading"}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-60"
              style={{
                background: restyleState === "done" ? "rgba(22,163,74,0.08)" : "#f7f6f3",
                border: `1px solid ${restyleState === "done" ? "rgba(22,163,74,0.3)" : "#e4e1da"}`,
                color: restyleState === "done" ? "#16a34a" : "#706d67",
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {restyleState === "loading" ? "Applying…" : restyleState === "done" ? "Applied!" : "Re-apply Subtitles"}
            </button>
          )}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: "#f7f6f3", color: "#706d67", border: "1px solid #e4e1da" }}
          >
            <RotateCcw className="w-3.5 h-3.5" /> New Upload
          </button>
          <a
            href={downloadAllUrl(jobId)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6d28d9, #e11d48)", color: "white", boxShadow: "0 2px 8px rgba(109,40,217,0.25)" }}
          >
            <Download className="w-3.5 h-3.5" /> Download All
          </a>
        </div>
      </div>

      {restyleError && (
        <div
          className="mb-4 px-4 py-3 rounded-xl text-xs font-medium"
          style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.18)", color: "#dc2626" }}
        >
          ⚠ {restyleError}
        </div>
      )}

      {/* Grid */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(168px, 1fr))" }}
      >
        {displayed.map((clip) => (
          <ClipCard
            key={clip.index}
            clip={clip}
            jobId={jobId}
            onSchedule={onSchedule}
            onEdit={style ? setEditClip : undefined}
            urlSuffix={cacheBuster}
          />
        ))}
      </div>

      {editClip && (
        <SubtitleEditModal
          clip={editClip}
          jobId={jobId}
          style={style}
          onClose={() => setEditClip(null)}
          onSaved={() => setCacheBuster(`?v=${Date.now()}`)}
        />
      )}
    </div>
  );
}
