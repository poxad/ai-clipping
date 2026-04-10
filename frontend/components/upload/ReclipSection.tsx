"use client";

import { useState } from "react";
import { reprocess } from "@/lib/api";
import type { HistoryEntry, StylePayload } from "@/lib/types";

interface Props {
  history: HistoryEntry[];
  currentStyle: StylePayload | null;
  onJobStart: (jobId: string) => void;
}

export function ReclipSection({ history, currentStyle, onJobStart }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(true);

  const singleJobs = history.filter((entry) =>
    entry.clips.length > 0 && entry.clips[0].source !== null
  );

  if (singleJobs.length === 0) return null;

  async function handleReclip(entry: HistoryEntry) {
    if (!currentStyle) return;
    setError(null);
    setLoading(entry.jobId);
    try {
      const newJobId = await reprocess(entry.jobId, currentStyle);
      onJobStart(newJobId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(null);
    }
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid #e4e1da", background: "#ffffff", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
    >
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setCollapsed((v) => !v)}
      >
        <span className="text-sm font-medium" style={{ color: "#706d67" }}>
          ♻ Re-clip a recent video
        </span>
        <span
          style={{
            color: "#9e9b94",
            fontSize: 10,
            transform: collapsed ? "rotate(-90deg)" : "none",
            transition: "transform 0.15s",
            display: "inline-block",
          }}
        >
          ▼
        </span>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4 flex flex-col gap-2" style={{ borderTop: "1px solid #f0ede8" }}>
          <p className="text-xs pt-3" style={{ color: "#9e9b94" }}>
            Re-run clipping on a previous upload using current subtitle settings. Skips transcription.
          </p>

          {error && (
            <div
              className="px-3 py-2 rounded-lg text-xs"
              style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.18)" }}
            >
              {error}
            </div>
          )}

          {singleJobs.map((entry) => (
            <div
              key={entry.jobId}
              className="flex flex-col items-start gap-3 px-3 py-2.5 rounded-lg sm:flex-row sm:items-center sm:justify-between"
              style={{ background: "#f7f6f3", border: "1px solid #e4e1da" }}
            >
              <div className="min-w-0">
                <span className="text-xs font-mono font-medium" style={{ color: "#1c1917" }}>
                  {entry.jobId.slice(0, 8)}…
                </span>
                <span className="ml-0 block text-xs sm:ml-2 sm:inline" style={{ color: "#9e9b94" }}>
                  {entry.count} clip{entry.count !== 1 ? "s" : ""} · {entry.date}
                </span>
              </div>
              <button
                onClick={() => handleReclip(entry)}
                disabled={loading === entry.jobId || !currentStyle}
                className="w-full rounded-lg px-3 py-2 text-xs font-semibold transition-all disabled:opacity-50 sm:w-auto"
                style={{
                  background: "rgba(109,40,217,0.08)",
                  border: "1px solid rgba(109,40,217,0.25)",
                  color: "#6d28d9",
                }}
              >
                {loading === entry.jobId ? "Starting…" : "Re-clip"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
