"use client";

import { useRef } from "react";
import { Download, CalendarPlus, Pencil } from "lucide-react";
import type { Clip } from "@/lib/types";
import { videoUrl, clipName } from "@/lib/api";

function formatDuration(s: number): string {
  if (s < 60) return `${Math.round(s)}s`;
  return `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 7 ? "#16a34a" : score >= 5 ? "#d97706" : "#dc2626";
  const bg    = score >= 7 ? "rgba(22,163,74,0.1)"  : score >= 5 ? "rgba(217,119,6,0.1)"  : "rgba(220,38,38,0.1)";
  const bdr   = score >= 7 ? "rgba(22,163,74,0.25)" : score >= 5 ? "rgba(217,119,6,0.25)" : "rgba(220,38,38,0.25)";
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-xs font-bold tabular-nums"
      style={{ background: bg, color, border: `1px solid ${bdr}`, minWidth: 28, height: 20, padding: "0 6px" }}
    >
      {score.toFixed(1)}/10
    </span>
  );
}

export function ClipCard({ clip, jobId, onSchedule, onEdit, urlSuffix }: { clip: Clip; jobId: string; onSchedule?: (clip: Clip) => void; onEdit?: (clip: Clip) => void; urlSuffix?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const name = clipName(clip);
  const url = videoUrl(jobId, name) + (urlSuffix ?? "");

  const playPromise = useRef<Promise<void> | null>(null);

  function handleEnter() {
    if (!videoRef.current) return;
    videoRef.current.muted = false;
    const p = videoRef.current.play();
    if (p !== undefined) {
      playPromise.current = p;
      p.catch(() => {
        if (videoRef.current) {
          videoRef.current.muted = true;
          const p2 = videoRef.current.play();
          if (p2 !== undefined) {
            playPromise.current = p2;
            p2.catch(() => {});
          }
        }
      });
    }
  }

  function handleLeave() {
    if (!videoRef.current) return;
    const v = videoRef.current;
    v.muted = true;
    
    if (playPromise.current !== undefined && playPromise.current !== null) {
      playPromise.current
        .then(() => {
          v.pause();
          v.currentTime = 0;
        })
        .catch(() => {});
    } else {
      v.pause();
      v.currentTime = 0;
    }
  }

  function handleClick() {
    const v = videoRef.current;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
    else if ((v as unknown as { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen) {
      (v as unknown as { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
    }
  }

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col transition-all cursor-pointer group"
      style={{
        background: "#ffffff",
        border: "1px solid #e4e1da",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {/* Video wrapper — 9:16 */}
      <div className="relative" style={{ aspectRatio: "9/16" }}>
        <video
          ref={videoRef}
          src={url}
          preload="none"
          loop
          muted
          playsInline
          onClick={handleClick}
          className="w-full h-full object-contain"
          style={{ display: "block", background: "#111" }}
        />
        {/* Clip index */}
        <span
          className="absolute top-2 left-2 text-xs font-bold px-1.5 py-0.5 rounded-md"
          style={{ background: "rgba(0,0,0,0.55)", color: "#fff", backdropFilter: "blur(4px)" }}
        >
          #{String(clip.index).padStart(3, "0")}
        </span>
        {/* Duration */}
        <span
          className="absolute bottom-2 right-2 text-xs font-bold px-1.5 py-0.5 rounded-md"
          style={{ background: "rgba(0,0,0,0.55)", color: "#fff", backdropFilter: "blur(4px)" }}
        >
          {formatDuration(clip.duration)}
        </span>
      </div>

      {/* Body */}
      <div className="px-3 pt-2.5 pb-1 flex-1 flex flex-col gap-1.5">
        {(clip.score != null || clip.clip_type) && (
          <div className="flex items-center gap-2 flex-wrap">
            {clip.score != null && <ScoreBadge score={clip.score} />}
            {clip.clip_type && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(109,40,217,0.08)", color: "#6d28d9", border: "1px solid rgba(109,40,217,0.2)" }}
              >
                {clip.clip_type}
              </span>
            )}
          </div>
        )}

        {clip.caption && (
          <p className="text-xs leading-relaxed font-medium" style={{ color: "#1c1917" }}>
            {clip.caption}
          </p>
        )}

        {/* {clip.transcript && (
          <p
            className="text-xs leading-relaxed"
            style={{
              color: "#9e9b94",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {clip.transcript}
          </p>
        )} */}

        {/* {clip.source && (
          <span
            className="inline-block text-xs px-2 py-0.5 rounded-full"
            style={{ background: "#f0ede8", color: "#9e9b94", border: "1px solid #e4e1da" }}
          >
            {clip.source}
          </span>
        )} */}
      </div>

      {/* Footer */}
      <div className="px-3 pb-3 flex gap-2">
        {onSchedule && (
          <button
            onClick={(e) => { e.stopPropagation(); onSchedule(clip); }}
            className="flex items-center justify-center gap-1 flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
            style={{ background: "rgba(109,40,217,0.08)", color: "#6d28d9", border: "1px solid rgba(109,40,217,0.2)" }}
          >
            <CalendarPlus className="w-3 h-3" /> Schedule
          </button>
        )}
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(clip); }}
            className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-lg text-xs font-semibold transition-all"
            style={{ background: "#f7f6f3", color: "#706d67", border: "1px solid #e4e1da" }}
            title="Edit subtitles"
          >
            <Pencil className="w-3 h-3" />
          </button>
        )}
        <a
          href={url}
          download={`clip_${String(clip.index).padStart(3, "0")}.mp4`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center justify-center gap-1.5 flex-1 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{ background: "#f7f6f3", color: "#706d67", border: "1px solid #e4e1da" }}
        >
          <Download className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
