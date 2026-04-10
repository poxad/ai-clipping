"use client";

import { useEffect, useState } from "react";
import { createClient } from "./supabase";
import type { Clip, HistoryEntry } from "./types";

const KEY = "ai_clip_history";
const MAX = 50;

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory([]);

    const sb = createClient();
    sb.auth.getUser().then(({ data }) => {
      if (!data.user) return;

      sb.from("jobs")
        .select("job_id, clips, created_at, filename")
        .eq("status", "done")
        .order("created_at", { ascending: false })
        .limit(MAX)
        .then(({ data: rows }) => {
          const remoteEntries: HistoryEntry[] = (rows ?? []).map((r) => ({
            jobId: r.job_id,
            clips: r.clips ?? [],
            count: (r.clips ?? []).length,
            date: new Date(r.created_at).toLocaleString(),
          }));

          setHistory(remoteEntries);
        });
    });
  }, []);

  function addEntry(jobId: string, clips: Clip[]) {
    const entry: HistoryEntry = {
      jobId,
      clips,
      count: clips.length,
      date: new Date().toLocaleString(),
    };
    setHistory((prev) => [entry, ...prev.filter((e) => e.jobId !== jobId)].slice(0, MAX));
  }

  return { history, addEntry };
}
