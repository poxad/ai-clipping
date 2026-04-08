"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getStatus } from "./api";
import { useHistory } from "./useHistory";
import type { Clip, JobStatus, StylePayload } from "./types";

interface PollState {
  status: JobStatus;
  progress: number;
  message: string;
  logs: string[];
  clips: Clip[];
}

interface JobContextValue {
  jobId: string | null;
  pollState: PollState;
  subtitleStyle: StylePayload | null;
  startJob: (id: string, style: StylePayload | null) => void;
  reset: () => void;
}

const IDLE: PollState = { status: "pending", progress: 0, message: "", logs: [], clips: [] };
const TERMINAL = new Set<JobStatus>(["done", "error"]);
const STORAGE_KEY = "active_job";

const JobContext = createContext<JobContextValue>({
  jobId: null,
  pollState: IDLE,
  subtitleStyle: null,
  startJob: () => {},
  reset: () => {},
});

export function JobProvider({ children }: { children: React.ReactNode }) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollState, setPollState] = useState<PollState>(IDLE);
  const [subtitleStyle, setSubtitleStyle] = useState<StylePayload | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addEntry } = useHistory();

  // Restore in-flight job from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { id, style } = JSON.parse(saved);
        if (id) {
          setJobId(id);
          setSubtitleStyle(style ?? null);
        }
      }
    } catch {}
  }, []);

  // Poll whenever jobId changes
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!jobId) {
      setPollState(IDLE);
      return;
    }

    setPollState(IDLE);

    async function poll() {
      try {
        const data = await getStatus(jobId!);
        const next: PollState = {
          status: data.status,
          progress: data.progress ?? 0,
          message: data.message ?? "",
          logs: data.logs ?? [],
          clips: data.clips ?? [],
        };
        setPollState(next);

        if (TERMINAL.has(data.status)) {
          if (timerRef.current) clearInterval(timerRef.current);
          localStorage.removeItem(STORAGE_KEY);
          if (data.status === "done" && data.clips?.length) {
            addEntry(jobId!, data.clips);
          }
        }
      } catch {
        // keep polling on transient errors
      }
    }

    poll();
    timerRef.current = setInterval(poll, 2000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [jobId]);

  function startJob(id: string, style: StylePayload | null) {
    setJobId(id);
    setSubtitleStyle(style);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ id, style }));
    } catch {}
  }

  function reset() {
    setJobId(null);
    setPollState(IDLE);
    setSubtitleStyle(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <JobContext.Provider value={{ jobId, pollState, subtitleStyle, startJob, reset }}>
      {children}
    </JobContext.Provider>
  );
}

export function useJob() {
  return useContext(JobContext);
}
