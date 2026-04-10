"use client";

import { useEffect, useState } from "react";
import { createClient } from "./supabase";
import type { Clip, HistoryEntry } from "./types";

const KEY = "ai_clip_history";
const MAX = 50;

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    // 1. Load from localStorage immediately (instant, works offline)
    let local: HistoryEntry[] = [];
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) local = JSON.parse(raw);
    } catch {}
    setHistory(local);

    // 2. If user is logged in, merge with Supabase records
    const sb = createClient();
    sb.auth.getUser().then(({ data }) => {
      if (!data.user) return;

      sb.from("jobs")
        .select("job_id, clips, created_at, filename")
        .eq("status", "done")
        .order("created_at", { ascending: false })
        .limit(MAX)
        .then(({ data: rows }) => {
          if (!rows?.length) return;

          const remoteEntries: HistoryEntry[] = rows.map((r) => ({
            jobId: r.job_id,
            clips: r.clips ?? [],
            count: (r.clips ?? []).length,
            date: new Date(r.created_at).toLocaleString(),
          }));

          // Merge: remote takes priority, deduplicate by jobId
          const merged = [
            ...remoteEntries,
            ...local.filter((l) => !remoteEntries.some((r) => r.jobId === l.jobId)),
          ].slice(0, MAX);

          setHistory(merged);
          try { localStorage.setItem(KEY, JSON.stringify(merged)); } catch {}
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
    // Write to localStorage synchronously so the history detail page can read it
    // immediately after a redirect — don't rely on the async state updater.
    try {
      const raw = localStorage.getItem(KEY);
      const prev: HistoryEntry[] = raw ? JSON.parse(raw) : [];
      const next = [entry, ...prev.filter((e) => e.jobId !== jobId)].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
    setHistory((prev) => [entry, ...prev.filter((e) => e.jobId !== jobId)].slice(0, MAX));
  }

  return { history, addEntry };
}
