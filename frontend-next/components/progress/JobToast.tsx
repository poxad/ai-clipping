"use client";

import { useRouter } from "next/navigation";
import { useJob } from "@/lib/JobContext";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export function JobToast() {
  const { jobId, pollState } = useJob();
  const router = useRouter();

  if (!jobId) return null;
  const { status, progress, message } = pollState;
  if (!["pending", "uploading", "extracting", "transcribing", "clipping", "rendering", "processing", "done", "error"].includes(status)) return null;

  const isActive = !["done", "error"].includes(status);
  const isDone = status === "done";
  const isError = status === "error";

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-1.5 rounded-2xl px-4 py-3 cursor-pointer transition-all"
      style={{
        background: "#ffffff",
        border: `1px solid ${isError ? "rgba(220,38,38,0.25)" : isDone ? "rgba(22,163,74,0.25)" : "#e4e1da"}`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        minWidth: 260,
        maxWidth: 320,
      }}
      onClick={() => router.push("/")}
    >
      <div className="flex items-center gap-2.5">
        {isActive && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" style={{ color: "#6d28d9" }} />}
        {isDone && <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#16a34a" }} />}
        {isError && <XCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#dc2626" }} />}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate" style={{ color: "#1c1917" }}>
            {isDone ? "Clips ready!" : isError ? "Processing failed" : "Processing video…"}
          </div>
          {message && (
            <div className="text-xs truncate mt-0.5" style={{ color: "#9e9b94" }}>
              {message}
            </div>
          )}
        </div>
        <span className="text-xs font-bold tabular-nums flex-shrink-0" style={{ color: isDone ? "#16a34a" : isError ? "#dc2626" : "#6d28d9" }}>
          {progress}%
        </span>
      </div>

      {isActive && (
        <div className="rounded-full overflow-hidden" style={{ height: 3, background: "#f0ede8" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: "linear-gradient(90deg, #6d28d9, #7c3aed)" }}
          />
        </div>
      )}

      {(isDone || isError) && (
        <div className="text-xs" style={{ color: "#9e9b94" }}>
          {isDone ? "Click to view clips →" : "Click to see details →"}
        </div>
      )}
    </div>
  );
}
