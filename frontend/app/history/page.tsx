"use client";

import { useState } from "react";
import { useHistory } from "@/lib/useHistory";
import { deleteJob } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Film, Clock, ChevronRight, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  const { history, deleteEntry } = useHistory();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function handleDelete(jobId: string) {
    setDeletingId(jobId);
    try {
      await deleteJob(jobId);
      deleteEntry(jobId);
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

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
            <div
              key={i}
              className="flex items-center gap-4 rounded-2xl border px-4 py-4 group transition-all duration-150 sm:px-5"
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

              {/* Info — clickable area */}
              <Link href={`/history/${entry.jobId}`} className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: "#171412" }}>
                    {entry.count} Clip{entry.count !== 1 ? "s" : ""} generated
                  </span>
                  <span className="status-dot text-xs font-semibold" style={{ color: "#2c6a50" }}>
                    Done
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock className="w-3 h-3" style={{ color: "#bfb39e" }} />
                  <span className="text-xs font-mono" style={{ color: "#83786c" }}>
                    {entry.date} · Job {entry.jobId.slice(0, 8)}…
                  </span>
                </div>
              </Link>

              <Link href={`/history/${entry.jobId}`} tabIndex={-1} className="flex-shrink-0">
                <ChevronRight
                  className="w-5 h-5 transition-transform group-hover:translate-x-0.5"
                  style={{ color: "#bfb39e" }}
                />
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex size-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[#f0e7d8] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#b85430]/20"
                  aria-label={`Open actions for job ${entry.jobId.slice(0, 8)}`}
                  disabled={deletingId === entry.jobId}
                  style={{ color: "#83786c" }}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-36 bg-white text-[#171412]">
                  <DropdownMenuItem
                    variant="destructive"
                    disabled={deletingId === entry.jobId}
                    onClick={() => setConfirmDeleteId(entry.jobId)}
                    className="gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => {
          if (!open && deletingId === null) setConfirmDeleteId(null);
        }}
      >
        <AlertDialogContent className="bg-white text-[#171412]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this history job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the job from your history and delete the generated clips for this
              job. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingId !== null}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={confirmDeleteId === null || deletingId !== null}
              onClick={() => {
                if (confirmDeleteId) void handleDelete(confirmDeleteId);
              }}
            >
              {deletingId !== null ? "Deleting..." : "Delete job"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
