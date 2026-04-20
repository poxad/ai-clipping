"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, Loader2 } from "lucide-react";
import type { JobStatus } from "@/lib/types";

const STEPS: { key: JobStatus; label: string; desc: string }[] = [
  { key: "extracting",  label: "Extract audio",   desc: "Pulling audio from video" },
  { key: "transcribing", label: "Transcribe",     desc: "AI listening to speech" },
  { key: "clipping",   label: "Find moments",    desc: "Detecting best clips" },
  { key: "rendering",  label: "Render clips",    desc: "Applying subtitles & cutting" },
];

const STEP_ORDER: JobStatus[] = ["extracting", "transcribing", "clipping", "rendering", "done"];

function stepState(stepKey: JobStatus, currentStatus: JobStatus): "done" | "active" | "idle" {
  const currentIdx = STEP_ORDER.indexOf(currentStatus);
  const stepIdx = STEP_ORDER.indexOf(stepKey);
  if (stepIdx < 0) return "idle";
  if (currentIdx > stepIdx) return "done";
  if (currentIdx === stepIdx) return "active";
  return "idle";
}

interface Props {
  status: JobStatus;
  progress: number;
  message: string;
  logs: string[];
}

export function ProgressCard({ status, progress, message, logs }: Props) {
  const [logsVisible, setLogsVisible] = useState(false);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid #d7cebf", background: "#fbf7f1" }}
    >
      {/* Progress bar — top */}
      <div style={{ height: 3, background: "#f0e7d8" }}>
        <div
          className="h-full transition-all duration-700"
          style={{
            width: `${progress}%`,
            background: "#171412",
            borderRadius: "0 2px 2px 0",
          }}
        />
      </div>

      {/* Header */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #f0e7d8" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(184,84,48,0.08)" }}
          >
            <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#b85430" }} />
          </div>
          <div>
            <div className="text-sm font-semibold" style={{ color: "#171412" }}>
              AI is processing your video
            </div>
            {message && (
              <div className="text-xs mt-0.5" style={{ color: "#83786c" }}>{message}</div>
            )}
          </div>
        </div>
        <span className="text-xl font-bold tabular-nums font-mono" style={{ color: "#171412" }}>
          {progress}%
        </span>
      </div>

      {/* Steps */}
      <div className="px-5 py-4 flex flex-col gap-2.5">
        {STEPS.map(({ key, label, desc }) => {
          const state = stepState(key, status);
          return (
            <div key={key} className="flex items-center gap-3">
              {/* Icon */}
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background:
                    state === "done"   ? "rgba(22,163,74,0.1)" :
                    state === "active" ? "rgba(184,84,48,0.1)" : "#f0e7d8",
                }}
              >
                {state === "done" ? (
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#16a34a" }} />
                ) : state === "active" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "#b85430" }} />
                ) : (
                  <div className="w-2 h-2 rounded-full" style={{ background: "#bfb39e" }} />
                )}
              </div>

              {/* Label */}
              <div className="flex-1">
                <span
                  className="text-xs font-semibold"
                  style={{
                    color:
                      state === "done"   ? "#16a34a" :
                      state === "active" ? "#b85430" : "#bfb39e",
                  }}
                >
                  {label}
                </span>
                {state === "active" && (
                  <span className="text-xs ml-2" style={{ color: "#83786c" }}>{desc}</span>
                )}
              </div>

              {state === "done" && (
                <span className="text-xs font-semibold" style={{ color: "#16a34a" }}>✓</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div style={{ borderTop: "1px solid #f0e7d8" }}>
          <button
            className="flex items-center gap-1.5 w-full px-5 py-2.5 text-xs font-medium transition-colors hover:bg-[#f7f1e7]"
            style={{ color: "#83786c" }}
            onClick={() => setLogsVisible((v) => !v)}
          >
            {logsVisible ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            {logsVisible ? "Hide technical details" : "Show technical details"}
          </button>
          {logsVisible && (
            <div
              className="mx-4 mb-4 rounded-xl px-3 py-2.5 text-xs font-mono max-h-36 overflow-y-auto"
              style={{ background: "#f7f1e7", border: "1px solid #d7cebf", color: "#83786c", lineHeight: 1.6 }}
            >
              {logs.map((line, i) => (
                <div key={i} style={{ color: i === logs.length - 1 ? "#171412" : undefined }}>
                  {line}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
