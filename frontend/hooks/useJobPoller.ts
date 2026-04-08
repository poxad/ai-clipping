"use client";

import { useEffect, useRef, useState } from "react";
import { getStatus } from "@/lib/api";
import type { Clip, JobStatus } from "@/lib/types";

interface PollState {
  status: JobStatus;
  progress: number;
  message: string;
  logs: string[];
  clips: Clip[];
}

const TERMINAL = new Set<JobStatus>(["done", "error"]);

export function useJobPoller(jobId: string | null) {
  const [state, setState] = useState<PollState>({
    status: "pending",
    progress: 0,
    message: "",
    logs: [],
    clips: [],
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobId) return;

    setState({ status: "pending", progress: 0, message: "", logs: [], clips: [] });

    async function poll() {
      try {
        const data = await getStatus(jobId!);
        setState({
          status: data.status,
          progress: data.progress ?? 0,
          message: data.message ?? "",
          logs: data.logs ?? [],
          clips: data.clips ?? [],
        });
        if (TERMINAL.has(data.status)) {
          if (timerRef.current) clearInterval(timerRef.current);
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

  return state;
}
