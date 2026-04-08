"use client";

import { useEffect, useState } from "react";
import type { Clip, HistoryEntry } from "./types";

const KEY = "ai_clip_history";
const MAX = 20;

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  function addEntry(jobId: string, clips: Clip[]) {
    const entry: HistoryEntry = {
      jobId,
      clips,
      count: clips.length,
      date: new Date().toLocaleString(),
    };
    setHistory((prev) => {
      const next = [entry, ...prev].slice(0, MAX);
      try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  return { history, addEntry };
}
