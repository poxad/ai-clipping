"use client";

import { useHistory } from "@/lib/useHistory";
import { Film, Clock, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  const { history } = useHistory();

  return (
    <div className="page-shell page-shell-wide flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <div className="eyebrow">Archive</div>
          <h1 className="editorial-title mt-2 text-[clamp(2rem,3.4vw,3.6rem)]" style={{ color: "#171412" }}>
            Past Jobs
          </h1>
          <p className="text-base mt-3 max-w-2xl" style={{ color: "#5e554d" }}>
            View and re-download clips from previous uploads.
          </p>
        </div>
        <Link
          href="/upload"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 flex-shrink-0"
          style={{ background: "#171412", color: "#f7f1e7" }}
        >
          <Plus className="w-4 h-4" /> New Upload
        </Link>
      </div>

      {history.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 rounded-2xl"
          style={{ background: "#fbf7f1", border: "1px dashed #d7cebf" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: "rgba(184,84,48,0.08)" }}
          >
            <Film className="w-7 h-7" style={{ color: "#b85430", opacity: 0.7 }} />
          </div>
          <p className="font-bold text-base" style={{ color: "#171412" }}>No clips yet</p>
          <p className="text-sm mt-1.5 text-center max-w-xs" style={{ color: "#83786c", lineHeight: 1.6 }}>
            Upload your first store recording to start generating TikTok clips.
          </p>
          <Link
            href="/"
            className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "#171412", color: "#f7f1e7" }}
          >
            <Plus className="w-4 h-4" /> Upload a Video
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {history.map((entry, i) => (
            <Link
              key={i}
              href={`/history/${entry.jobId}`}
              className="flex items-center gap-4 rounded-2xl border px-4 py-4 cursor-pointer group transition-all duration-150 sm:px-5"
              style={{ borderColor: "#d7cebf", background: "#fbf7f1", boxShadow: "none" }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(184,84,48,0.35)";
                el.style.boxShadow = "0 16px 34px rgba(23,20,18,0.06)";
                el.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "#d7cebf";
                el.style.boxShadow = "none";
                el.style.transform = "translateY(0)";
              }}
            >
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(184,84,48,0.08)" }}
              >
                <Film className="w-5 h-5" style={{ color: "#b85430" }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: "#171412" }}>
                    {entry.count} Clip{entry.count !== 1 ? "s" : ""} generated
                  </span>
                  <span
                    className="status-dot text-xs font-semibold"
                    style={{ color: "#2c6a50" }}
                  >
                    Done
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock className="w-3 h-3" style={{ color: "#bfb39e" }} />
                  <span className="text-xs font-mono" style={{ color: "#83786c" }}>
                    {entry.date} · Job {entry.jobId.slice(0, 8)}…
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight
                className="w-5 h-5 flex-shrink-0 transition-transform group-hover:translate-x-0.5"
                style={{ color: "#bfb39e" }}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
