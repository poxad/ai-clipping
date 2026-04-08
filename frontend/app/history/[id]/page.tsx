"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ClipsGrid } from "@/components/clips/ClipsGrid";
import { SubtitleEditor } from "@/components/subtitle/SubtitleEditor";
import { ScheduleModal } from "@/components/scheduler/ScheduleModal";
import type { Clip, HistoryEntry, StylePayload } from "@/lib/types";

const KEY = "ai_clip_history";

export default function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<HistoryEntry | null>(null);
  const [style, setStyle] = useState<StylePayload | null>(null);
  const [scheduleClip, setScheduleClip] = useState<Clip | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const history: HistoryEntry[] = JSON.parse(raw);
      const found = history.find((e) => e.jobId === id);
      setEntry(found ?? null);
    } catch {}
  }, [id]);

  if (entry === null) {
    return (
      <div className="flex flex-col gap-6 p-8 max-w-5xl w-full">
        <div className="flex items-center gap-3">
          <Link
            href="/history"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: "#ffffff", color: "#706d67", border: "1px solid #e4e1da", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
          >
            <ArrowLeft className="w-4 h-4" /> Back to History
          </Link>
        </div>
        <div
          className="flex flex-col items-center justify-center py-24 rounded-xl border"
          style={{ background: "#ffffff", borderColor: "#e4e1da" }}
        >
          <p className="font-semibold text-sm" style={{ color: "#1c1917" }}>Job not found</p>
          <p className="text-sm mt-1" style={{ color: "#9e9b94" }}>This job may have been cleared from history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-8 max-w-5xl w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/history"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: "#ffffff", color: "#706d67", border: "1px solid #e4e1da", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> History
            </Link>
          </div>
          {/* <h1 className="text-2xl font-bold" style={{ color: "#1c1917" }}>
            {entry.count} Clip{entry.count !== 1 ? "s" : ""}
          </h1>
          <div className="flex items-center gap-4 mt-1.5">
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "#9e9b94" }}>
              <Hash className="w-3 h-3" />
              {entry.jobId.slice(0, 12)}…
            </span>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "#9e9b94" }}>
              <Calendar className="w-3 h-3" />
              {entry.date}
            </span>
          </div> */}
        </div>
      </div>

      {/* Subtitle Template */}
      <SubtitleEditor onStyleChange={setStyle} />

      {/* Clips */}
      <ClipsGrid
        clips={entry.clips}
        jobId={entry.jobId}
        style={style}
        onSchedule={setScheduleClip}
        onReset={() => router.push("/history")}
      />

      {scheduleClip && (
        <ScheduleModal
          clip={scheduleClip}
          jobId={entry.jobId}
          onClose={() => setScheduleClip(null)}
          onScheduled={() => setScheduleClip(null)}
        />
      )}
    </div>
  );
}
