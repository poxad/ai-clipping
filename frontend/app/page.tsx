"use client";

import { useState, useEffect } from "react";
import { UploadZone } from "@/components/upload/UploadZone";
import { BatchPreview } from "@/components/upload/BatchPreview";
import { ReclipSection } from "@/components/upload/ReclipSection";
import { SubtitleEditor } from "@/components/subtitle/SubtitleEditor";
import { ProgressCard } from "@/components/progress/ProgressCard";
import { ClipsGrid } from "@/components/clips/ClipsGrid";
import { ScheduleModal } from "@/components/scheduler/ScheduleModal";
import { useJob } from "@/lib/JobContext";
import { useHistory } from "@/lib/useHistory";
import { uploadSingle, uploadBatch } from "@/lib/api";
import type { Clip, StylePayload } from "@/lib/types";
import { Store, Mic, ChevronDown, ChevronUp, Wand2 } from "lucide-react";

type Mode = "single" | "batch";
type ContentType = "retail" | "podcast";

const VOCAB_KEY = "whisper_vocab";

function SectionLabel({ step, title, desc }: { step: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
        style={{ background: "linear-gradient(135deg, #6d28d9, #7c3aed)", color: "white" }}
      >
        {step}
      </div>
      <div>
        <div className="text-sm font-bold" style={{ color: "#1c1917" }}>{title}</div>
        <div className="text-xs mt-0.5" style={{ color: "#9e9b94" }}>{desc}</div>
      </div>
    </div>
  );
}

export default function UploadPage() {
  const [mode] = useState<Mode>("single");
  const [contentType, setContentType] = useState<ContentType>("retail");
  const [whisperVocab, setWhisperVocab] = useState<string>("kacamata moo\nwhatsapp");
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subtitleStyle, setSubtitleStyle] = useState<StylePayload | null>(null);
  const [showVocab, setShowVocab] = useState(false);
  const [scheduleClip, setScheduleClip] = useState<Clip | null>(null);

  const { history } = useHistory();
  const { jobId, pollState, startJob, reset } = useJob();

  useEffect(() => {
    const saved = localStorage.getItem(VOCAB_KEY);
    if (saved) setWhisperVocab(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem(VOCAB_KEY, whisperVocab);
  }, [whisperVocab]);

  function buildStyle(): StylePayload | null {
    if (!subtitleStyle) return null;
    return { ...subtitleStyle, content_type: contentType, whisper_prompt: whisperVocab || undefined };
  }

  async function startSingle(file: File) {
    const style = buildStyle();
    if (!style) return;
    setError(null);
    setUploading(true);
    try {
      const id = await uploadSingle(file, style);
      startJob(id, style);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  }

  async function startBatch() {
    const style = buildStyle();
    if (!style || !batchFiles.length) return;
    setError(null);
    setUploading(true);
    try {
      const id = await uploadBatch(batchFiles, style);
      startJob(id, style);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
    }
  }

  function handleReset() {
    reset();
    setBatchFiles([]);
    setError(null);
  }

  const showProgress = (jobId && !["done", "error"].includes(pollState.status)) || uploading;
  const showClips = pollState.status === "done" && pollState.clips.length > 0;

  return (
    <div className="flex flex-col gap-8 p-8 max-w-3xl w-full">

      {/* Page header */}
      {!jobId && (
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1c1917", letterSpacing: "-0.02em" }}>
            Create TikTok Clips
          </h1>
          <p className="text-sm mt-1.5" style={{ color: "#9e9b94", lineHeight: 1.6 }}>
            Upload a store recording — AI transcribes it, finds the best moments, and produces ready-to-post short clips.
          </p>
        </div>
      )}

      {/* Step 1 — Content type */}
      {!jobId && (
        <div
          className="rounded-2xl p-5"
          style={{ background: "#ffffff", border: "1px solid #e4e1da", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
        >
          <SectionLabel step={1} title="What type of video is this?" desc="Helps the AI pick better clip boundaries and captions" />
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: "retail",  icon: Store, label: "Employee Generated Contenta",  desc: "Customer service, product demos, try-ons" },
              { key: "podcast", icon: Mic,   label: "Podcast / Talk",  desc: "Interviews, conversations, commentary" },
            ] as const).map(({ key, icon: Icon, label, desc }) => (
              <button
                key={key}
                onClick={() => setContentType(key)}
                className="flex items-start gap-3 px-4 py-3.5 rounded-xl text-left transition-all"
                style={{
                  background: contentType === key ? "rgba(109,40,217,0.06)" : "#fafaf8",
                  border: `2px solid ${contentType === key ? "#6d28d9" : "#e4e1da"}`,
                  boxShadow: contentType === key ? "0 0 0 3px rgba(109,40,217,0.08)" : "none",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: contentType === key ? "rgba(109,40,217,0.12)" : "#f0ede8" }}
                >
                  <Icon className="w-4 h-4" style={{ color: contentType === key ? "#6d28d9" : "#9e9b94" }} />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: contentType === key ? "#6d28d9" : "#1c1917" }}>
                    {label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#9e9b94" }}>{desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — Upload */}
      {!jobId && (
        <div
          className="rounded-2xl p-5"
          style={{ background: "#ffffff", border: "1px solid #e4e1da", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
        >
          <SectionLabel step={2} title="Upload your video" desc="Drop a raw recording — unedited is totally fine" />
          <UploadZone
            mode={mode}
            disabled={uploading}
            onSingleFile={startSingle}
            onBatchFiles={(files) => setBatchFiles(files)}
          />

          {mode === "batch" && batchFiles.length > 0 && (
            <div className="mt-4">
              <BatchPreview
                files={batchFiles}
                onClear={() => setBatchFiles([])}
                onUpload={startBatch}
                uploading={uploading}
              />
            </div>
          )}

          {/* Brand words */}
          <div className="mt-4">
            <button
              onClick={() => setShowVocab((v) => !v)}
              className="flex items-center gap-2 text-xs font-semibold transition-colors w-full"
              style={{ color: showVocab ? "#6d28d9" : "#9e9b94" }}
            >
              <Wand2 className="w-3.5 h-3.5" />
              Brand name hints for better transcription
              {showVocab
                ? <ChevronUp className="w-3.5 h-3.5 ml-auto" />
                : <ChevronDown className="w-3.5 h-3.5 ml-auto" />
              }
            </button>
            {showVocab && (
              <div className="mt-3">
                <p className="text-xs mb-2" style={{ color: "#9e9b94" }}>
                  Add brand names, product names, or local words the AI might misspell — one per line.
                </p>
                <textarea
                  value={whisperVocab}
                  onChange={(e) => setWhisperVocab(e.target.value)}
                  rows={4}
                  placeholder={"Kacamata Moo\nlensa kontak\nsilinder\ncek mata"}
                  className="w-full rounded-xl px-3 py-2.5 text-xs resize-none"
                  style={{
                    background: "#fafaf8",
                    border: "1px solid #e4e1da",
                    color: "#1c1917",
                    outline: "none",
                    fontFamily: "monospace",
                    lineHeight: 1.6,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3 — Subtitle style */}
      {!jobId && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid #e4e1da", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
        >
          <div className="flex items-start gap-3 px-5 pt-5 pb-4">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
              style={{ background: "linear-gradient(135deg, #6d28d9, #7c3aed)", color: "white" }}
            >
              3
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: "#1c1917" }}>Subtitle Style</div>
              <div className="text-xs mt-0.5" style={{ color: "#9e9b94" }}>Customize how captions look on your clips</div>
            </div>
          </div>
          <SubtitleEditor onStyleChange={setSubtitleStyle} />
        </div>
      )}

      {/* Re-clip section */}
      {!jobId && (
        <ReclipSection
          history={history}
          currentStyle={buildStyle()}
          onJobStart={(id) => startJob(id, buildStyle())}
        />
      )}

      {/* Error */}
      {error && (
        <div
          className="flex items-start gap-3 px-4 py-3.5 rounded-xl text-sm"
          style={{ background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.18)", color: "#dc2626" }}
        >
          <span className="text-base flex-shrink-0">⚠️</span>
          <div>
            <div className="font-semibold">Upload failed</div>
            <div className="text-xs mt-0.5 opacity-80">{error}</div>
          </div>
        </div>
      )}

      {/* Progress */}
      {showProgress && (
        <ProgressCard
          status={uploading ? "uploading" : pollState.status}
          progress={uploading ? 2 : pollState.progress}
          message={uploading ? "Uploading your video…" : pollState.message}
          logs={pollState.logs}
        />
      )}

      {/* Clips */}
      {showClips && jobId && (
        <ClipsGrid
          clips={pollState.clips}
          jobId={jobId}
          onReset={handleReset}
          onSchedule={setScheduleClip}
          style={subtitleStyle}
        />
      )}

      {/* Schedule modal */}
      {scheduleClip && jobId && (
        <ScheduleModal
          clip={scheduleClip}
          jobId={jobId}
          onClose={() => setScheduleClip(null)}
          onScheduled={() => setScheduleClip(null)}
        />
      )}
    </div>
  );
}
