"use client";

import { useHistory } from "@/lib/useHistory";
import { Film, Clock, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  const { history } = useHistory();

  return (
    <div className="flex flex-col gap-6 p-8 max-w-9xl w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1c1917", letterSpacing: "-0.02em" }}>
            Past Jobs
          </h1>
          <p className="text-sm mt-1.5" style={{ color: "#9e9b94" }}>
            View and re-download clips from previous uploads.
          </p>
        </div>
        <Link
          href="/upload"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #6d28d9, #e11d48)", color: "white", boxShadow: "0 2px 8px rgba(109,40,217,0.25)" }}
        >
          <Plus className="w-4 h-4" /> New Upload
        </Link>
      </div>

      {history.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 rounded-2xl"
          style={{ background: "#ffffff", border: "2px dashed #e4e1da" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
            style={{ background: "linear-gradient(135deg, rgba(109,40,217,0.08), rgba(225,29,72,0.06))" }}
          >
            <Film className="w-7 h-7" style={{ color: "#6d28d9", opacity: 0.6 }} />
          </div>
          <p className="font-bold text-base" style={{ color: "#1c1917" }}>No clips yet</p>
          <p className="text-sm mt-1.5 text-center max-w-xs" style={{ color: "#9e9b94", lineHeight: 1.6 }}>
            Upload your first store recording to start generating TikTok clips.
          </p>
          <Link
            href="/"
            className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #6d28d9, #e11d48)", color: "white", boxShadow: "0 2px 8px rgba(109,40,217,0.25)" }}
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
              className="flex items-center gap-4 rounded-2xl px-5 py-4 border cursor-pointer group transition-all duration-150"
              style={{ borderColor: "#e4e1da", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "rgba(109,40,217,0.3)";
                el.style.boxShadow = "0 4px 16px rgba(109,40,217,0.1)";
                el.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "#e4e1da";
                el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.04)";
                el.style.transform = "translateY(0)";
              }}
            >
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, rgba(109,40,217,0.08), rgba(225,29,72,0.06))" }}
              >
                <Film className="w-5 h-5" style={{ color: "#6d28d9" }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: "#1c1917" }}>
                    {entry.count} Clip{entry.count !== 1 ? "s" : ""} generated
                  </span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(22,163,74,0.08)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.2)" }}
                  >
                    Done
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock className="w-3 h-3" style={{ color: "#c4c1bb" }} />
                  <span className="text-xs" style={{ color: "#9e9b94" }}>
                    {entry.date} · Job {entry.jobId.slice(0, 8)}…
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight
                className="w-5 h-5 flex-shrink-0 transition-transform group-hover:translate-x-0.5"
                style={{ color: "#c4c1bb" }}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
