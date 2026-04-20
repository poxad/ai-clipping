"use client";

import { useState } from "react";
import { Download, Star, RotateCcw } from "lucide-react";
import { ClipCard } from "./ClipCard";
import { SubtitleEditModal } from "./SubtitleEditModal";
import { downloadAllUrl, clipName } from "@/lib/api";
import type { Clip } from "@/lib/types";

interface Props {
  clips: Clip[];
  jobId: string;
  onReset: () => void;
  onSchedule?: (clip: Clip) => void;
}

export function ClipsGrid({ clips, jobId, onReset, onSchedule }: Props) {
  const [sortByScore, setSortByScore] = useState(true);
  const [cacheBuster, setCacheBuster] = useState("");
  const [editClip, setEditClip] = useState<Clip | null>(null);

  const hasScores = clips.some((c) => c.score != null);

  const displayed = sortByScore
    ? [...clips].sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
    : clips;

  return (
    <div>
      {/* Header */}
      <div
        className="mb-5 flex flex-col items-start justify-between gap-4 rounded-2xl p-4 sm:flex-row"
        style={{ background: "#fbf7f1", border: "1px solid #d7cebf", boxShadow: "none" }}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold" style={{ color: "#171412" }}>
              {clips.length} Clip{clips.length !== 1 ? "s" : ""} Ready
            </h2>
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.2)" }}
            >
              ✓ Done
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: "#83786c" }}>
            Tap to preview · Tap again to fullscreen · Tap the pencil to edit subtitles
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto sm:justify-end">
          {hasScores && (
            <button
              onClick={() => setSortByScore((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: sortByScore ? "rgba(184,84,48,0.08)" : "#f7f1e7",
                border: `1px solid ${sortByScore ? "rgba(184,84,48,0.2)" : "#d7cebf"}`,
                color: sortByScore ? "#b85430" : "#5e554d",
              }}
            >
              <Star className="w-3.5 h-3.5" />
              {sortByScore ? "Sorted by Score" : "Sort by Score"}
            </button>
          )}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: "#f7f1e7", color: "#5e554d", border: "1px solid #d7cebf" }}
          >
            <RotateCcw className="w-3.5 h-3.5" /> New Upload
          </button>
          <a
            href={downloadAllUrl(jobId)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
            style={{ background: "#171412", color: "#f7f1e7", boxShadow: "none" }}
          >
            <Download className="w-3.5 h-3.5" /> Download All
          </a>
        </div>
      </div>

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
            onEdit={setEditClip}
            urlSuffix={cacheBuster}
          />
        ))}
      </div>

      {editClip && (
        <SubtitleEditModal
          clip={editClip}
          jobId={jobId}
          onClose={() => setEditClip(null)}
          onSaved={() => {
            setCacheBuster(`?v=${Date.now()}`);
            setEditClip(null);
          }}
        />
      )}
    </div>
  );
}
