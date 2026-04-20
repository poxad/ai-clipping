"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { ClipsGrid } from "@/components/clips/ClipsGrid";
import { ScheduleModal } from "@/components/scheduler/ScheduleModal";
import { getStatus } from "@/lib/api";
import { useHistory } from "@/lib/useHistory";
import type { Clip, HistoryEntry } from "@/lib/types";

const KEY = "ai_clip_history";

export default function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addEntry } = useHistory();

  // undefined = still loading, null = not found, HistoryEntry = found
  const [entry, setEntry] = useState<HistoryEntry | null | undefined>(undefined);
  const [polling, setPolling] = useState(false);
  const [pollMessage, setPollMessage] = useState("");
  const [scheduleClip, setScheduleClip] = useState<Clip | null>(null);

  useEffect(() => {
    // 1. Try localStorage first (instant)
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const history: HistoryEntry[] = JSON.parse(raw);
        const found = history.find((e) => e.jobId === id);
        if (found) {
          setEntry(found);
          return;
        }
      }
    } catch {}

    // 2. Try Supabase directly (survives Railway restarts)
    async function trySupabase(): Promise<boolean> {
      try {
        const { createClient } = await import("@/lib/supabase");
        const sb = createClient();
        const { data } = await sb.from("jobs")
          .select("job_id, clips, created_at, filename")
          .eq("job_id", id)
          .eq("status", "done")
          .single();
        if (data?.clips?.length) {
          const e: HistoryEntry = {
            jobId: data.job_id,
            clips: data.clips,
            count: data.clips.length,
            date: new Date(data.created_at).toLocaleString(),
          };
          addEntry(id, data.clips);
          setEntry(e);
          return true;
        }
      } catch {}
      return false;
    }

    // 3. Not in Supabase yet — poll the backend until done or error
    setPolling(true);
    let timer: ReturnType<typeof setInterval>;
    let backendErrors = 0;
    const MAX_BACKEND_ERRORS = 5;

    async function poll() {
      // Check Supabase first on each poll (backend SQLite is wiped on restart)
      if (await trySupabase()) {
        clearInterval(timer);
        setPolling(false);
        return;
      }

      try {
        const data = await getStatus(id);
        backendErrors = 0; // reset on success

        if (data.status === "done") {
          clearInterval(timer);
          setPolling(false);
          if (data.clips?.length) {
            const e: HistoryEntry = {
              jobId: id,
              clips: data.clips,
              count: data.clips.length,
              date: new Date().toLocaleString(),
            };
            addEntry(id, data.clips);
            setEntry(e);
          } else {
            // done but no clips — show not found
            setEntry(null);
          }
        } else if (data.status === "error") {
          clearInterval(timer);
          setPolling(false);
          setEntry(null);
        } else {
          setPollMessage(data.message || "Processing…");
        }
      } catch {
        // Backend unreachable — could be a transient error or restart.
        // Retry up to MAX_BACKEND_ERRORS times before giving up.
        backendErrors += 1;
        if (backendErrors >= MAX_BACKEND_ERRORS) {
          clearInterval(timer);
          setPolling(false);
          setEntry(null);
        }
      }
    }

    poll();
    timer = setInterval(poll, 2000);
    return () => clearInterval(timer);
  }, [id]);

  // ── Still loading / polling ──
  if (entry === undefined) {
    return (
      <div className="page-shell page-shell-wide flex flex-col gap-6">
        <Link
          href="/history"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium w-fit"
          style={{ background: "#fbf7f1", color: "#5e554d", border: "1px solid #d7cebf" }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> History
        </Link>

        <div
          className="flex flex-col items-center justify-center gap-4 py-24 rounded-xl border"
          style={{ background: "#fbf7f1", borderColor: "#d7cebf" }}
        >
          {polling ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#b85430" }} />
              <div className="text-center">
                <p className="font-semibold text-sm" style={{ color: "#171412" }}>Still processing…</p>
                <p className="text-xs mt-1" style={{ color: "#83786c" }}>{pollMessage || "Rendering clips, hang tight"}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: "rgba(184,84,48,0.07)", color: "#b85430" }}>
                This page will update automatically when done
              </div>
            </>
          ) : (
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#83786c" }} />
          )}
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (entry === null) {
    return (
      <div className="page-shell page-shell-reading flex flex-col gap-6">
        <Link
          href="/history"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium w-fit"
          style={{ background: "#fbf7f1", color: "#5e554d", border: "1px solid #d7cebf" }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to History
        </Link>
        <div
          className="flex flex-col items-center justify-center py-24 rounded-xl border"
          style={{ background: "#fbf7f1", borderColor: "#d7cebf" }}
        >
          <p className="font-semibold text-sm" style={{ color: "#171412" }}>Job not found</p>
          <p className="text-sm mt-1" style={{ color: "#83786c" }}>This job may have been cleared or failed.</p>
        </div>
      </div>
    );
  }

  // ── Found ──
  return (
    <div className="page-shell page-shell-wide flex flex-col gap-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              href="/history"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{ background: "#fbf7f1", color: "#5e554d", border: "1px solid #d7cebf", boxShadow: "none" }}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> History
            </Link>
          </div>
        </div>
      </div>

      <ClipsGrid
        clips={entry.clips}
        jobId={entry.jobId}
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
