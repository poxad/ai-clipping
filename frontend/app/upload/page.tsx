"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
import { useUserSettings } from "@/lib/useUserSettings";
import type { Clip, StylePayload } from "@/lib/types";
import { Store, Mic, Sparkles, ChevronDown, ChevronUp, Wand2, Check, X, Play } from "lucide-react";

type Mode = "single" | "batch";
type ContentType = "retail" | "podcast" | "general";

const VOCAB_KEY = "whisper_vocab";
const CONTENT_TYPE_KEY = "content_type";

function SectionLabel({ step, title, desc }: { step: number; title: string; desc: string }) {
  const numeral = ["I", "II", "III"][step - 1] ?? String(step);

  return (
    <div className="flex items-start gap-3 mb-4">
      <div className="step-marker mt-0.5 min-w-7 flex-shrink-0">
        {numeral}
      </div>
      <div>
        <div className="eyebrow">Step {numeral}</div>
        <div className="editorial-title mt-1 text-[1.45rem]" style={{ color: "#171412" }}>{title}</div>
        <div className="text-sm mt-1.5 max-w-2xl" style={{ color: "#5e554d" }}>{desc}</div>
      </div>
    </div>
  );
}

export default function UploadPage() {
  const [mode] = useState<Mode>("single");
  const [contentType, setContentType] = useState<ContentType>("retail");
  const [whisperVocab, setWhisperVocab] = useState<string>("kacamata moo\nwhatsapp");
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [subtitleStyle, setSubtitleStyle] = useState<StylePayload | null>(null);
  const [showVocab, setShowVocab] = useState(false);
  const [scheduleClip, setScheduleClip] = useState<Clip | null>(null);
  const { processingSettings, saveProcessingSettings, loaded: settingsLoaded } = useUserSettings();

  const { history } = useHistory();
  const { jobId, pollState, startJob, reset } = useJob();
  const didHydrateRemoteSettings = useRef(false);
  const hasPrimedRemoteSave = useRef(false);
  const resetRef = useRef(reset);

  useEffect(() => {
    const saved = localStorage.getItem(VOCAB_KEY);
    if (saved) setWhisperVocab(saved);
    const savedContentType = localStorage.getItem(CONTENT_TYPE_KEY);
    if (savedContentType === "retail" || savedContentType === "podcast" || savedContentType === "general") {
      setContentType(savedContentType);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(VOCAB_KEY, whisperVocab);
  }, [whisperVocab]);

  useEffect(() => {
    localStorage.setItem(CONTENT_TYPE_KEY, contentType);
  }, [contentType]);

  useEffect(() => {
    if (!settingsLoaded || didHydrateRemoteSettings.current) return;

    if (processingSettings?.contentType) {
      setContentType(processingSettings.contentType);
    }
    if (processingSettings?.whisperVocab !== undefined) {
      setWhisperVocab(processingSettings.whisperVocab);
    }

    didHydrateRemoteSettings.current = true;
  }, [settingsLoaded, processingSettings]);

  useEffect(() => {
    if (!settingsLoaded || !didHydrateRemoteSettings.current) return;
    if (!hasPrimedRemoteSave.current) {
      hasPrimedRemoteSave.current = true;
      return;
    }

    const timer = window.setTimeout(() => {
      void saveProcessingSettings({
        contentType,
        whisperVocab,
      });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [contentType, whisperVocab, settingsLoaded, saveProcessingSettings]);

  const prevStatus = useRef<string>("");
  useEffect(() => {
    resetRef.current = reset;
  }, [reset]);

  useEffect(() => {
    // Only redirect if the status *transitioned* to done during this session
    // (not if we loaded with an already-done stale job from localStorage)
    if (pollState.status === "done" && jobId && prevStatus.current !== "" && prevStatus.current !== "done") {
      const completedJobId = jobId;
      resetRef.current();
      router.push(`/history/${completedJobId}`);
    }
    prevStatus.current = pollState.status;
  }, [pollState.status, jobId, router]);

  function buildStyle(): StylePayload | null {
    if (!subtitleStyle) return null;
    return { ...subtitleStyle, content_type: contentType, whisper_prompt: whisperVocab || undefined };
  }

  async function startSingle(file: File) {
    const style = buildStyle() ?? ({} as StylePayload);
    setError(null);
    setUploading(true);
    setUploadPct(0);
    try {
      const id = await uploadSingle(file, style, setUploadPct);
      startJob(id, style);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
      setUploadPct(0);
    }
  }

  async function handleProcess() {
    if (!stagedFile) return;
    await startSingle(stagedFile);
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
    setStagedFile(null);
    setBatchFiles([]);
    setError(null);
  }

  const showProgress = (jobId && !["done", "error"].includes(pollState.status)) || uploading;
  const showClips = pollState.status === "done" && pollState.clips.length > 0;

  return (
    <div className="page-shell page-shell-wide flex flex-col gap-6 sm:gap-8">

      {/* Page header */}
      {!jobId && (
        <div>
          {/* <div className="eyebrow">Editorial Workshop</div> */}
          <h1 className="editorial-title mt-2 text-[clamp(2.25rem,4vw,4.75rem)]" style={{ color: "#171412" }}>
            Create TikTok Clips
          </h1>
          <p className="text-base mt-4" style={{ color: "#5e554d", lineHeight: 1.8 }}>
            Upload a store recording — AI transcribes it, finds the best moments, and produces ready-to-post short clips.
          </p>
        </div>
      )}

      {/* Step 1 — Content type */}
      {!jobId && (
        <div
          className="panel p-4 sm:p-5 lg:p-7"
        >
          <SectionLabel step={1} title="What type of video is this?" desc="Helps the AI pick better clip boundaries and captions" />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {([
              { key: "retail",  icon: Store, label: "Employee Generated Content",  desc: "Customer service, product demos, try-ons" },
              { key: "podcast", icon: Mic,   label: "Podcast / Talk",  desc: "Interviews, conversations, commentary" },
              { key: "general", icon: Sparkles, label: "General", desc: "Any footage type, broad short-form clip discovery" },
            ] as const).map(({ key, icon: Icon, label, desc }) => (
              <button
                key={key}
                onClick={() => setContentType(key)}
                className="flex items-start gap-3 px-4 py-3.5 rounded-xl text-left transition-all"
                style={{
                  background: contentType === key ? "rgba(184,84,48,0.05)" : "#f7f1e7",
                  border: `1px solid ${contentType === key ? "#b85430" : "#d7cebf"}`,
                  boxShadow: "none",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: contentType === key ? "rgba(184,84,48,0.12)" : "#f0e7d8" }}
                >
                  <Icon className="w-4 h-4" style={{ color: contentType === key ? "#b85430" : "#83786c" }} />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "#171412" }}>
                    {label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#83786c" }}>{desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — Upload */}
      {!jobId && (
        <div
          className="panel p-4 sm:p-5 lg:p-7"
        >
          <SectionLabel step={2} title="Upload your video" desc="Drop a raw recording — unedited is totally fine" />

          {stagedFile ? (
            /* Staged file pill */
            <div
              className="flex flex-col items-start gap-3 px-4 py-3 sm:flex-row sm:items-center rounded-xl"
              style={{ background: "rgba(44,106,80,0.06)", border: "1px solid rgba(44,106,80,0.2)" }}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(44,106,80,0.12)" }}
              >
                <Check className="w-4 h-4" style={{ color: "#2c6a50" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: "#171412" }}>{stagedFile.name}</div>
                <div className="text-xs font-mono" style={{ color: "#83786c" }}>{(stagedFile.size / (1024 * 1024)).toFixed(1)} MB · Ready to process</div>
              </div>
              <button
                onClick={() => setStagedFile(null)}
                className="p-1.5 rounded-lg transition-colors hover:bg-red-50"
                title="Remove file"
              >
                <X className="w-4 h-4" style={{ color: "#9e9b94" }} />
              </button>
            </div>
          ) : (
            <UploadZone
              mode={mode}
              disabled={uploading}
              onSingleFile={setStagedFile}
              onBatchFiles={(files) => setBatchFiles(files)}
            />
          )}

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
                style={{ color: showVocab ? "#b85430" : "#83786c" }}
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
                <p className="text-xs mb-2" style={{ color: "#83786c" }}>
                  Add brand names, product names, or local words the AI might misspell — one per line.
                </p>
                <textarea
                  value={whisperVocab}
                  onChange={(e) => setWhisperVocab(e.target.value)}
                  rows={4}
                  placeholder={"Kacamata Moo\nlensa kontak\nsilinder\ncek mata"}
                  className="w-full rounded-xl px-3 py-2.5 text-xs resize-none"
                  style={{
                    background: "#f7f1e7",
                    border: "1px solid #d7cebf",
                    color: "#171412",
                    outline: "none",
                    fontFamily: "var(--font-mono)",
                    lineHeight: 1.6,
                  }}
                />
                <p className="text-[11px] mt-2 font-mono" style={{ color: "#83786c" }}>
                  Brand hints and content type are saved to your Supabase settings automatically.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3 — Subtitle style */}
      {!jobId && (
        <div
          className="panel overflow-hidden"
        >
          <div className="flex items-start gap-3 px-4 pt-4 pb-4 sm:px-5 sm:pt-5">
            <div className="step-marker mt-0.5 min-w-7 flex-shrink-0">III</div>
            <div>
              <div className="eyebrow">Step III</div>
              <div className="editorial-title mt-1 text-[1.45rem]" style={{ color: "#171412" }}>Subtitle Style</div>
              <div className="text-sm mt-1.5" style={{ color: "#5e554d" }}>Pick a template, choose your font, then process.</div>
            </div>
          </div>
          <SubtitleEditor onStyleChange={setSubtitleStyle} />
        </div>
      )}

      {/* Process Video button */}
      {!jobId && (
        <button
          onClick={handleProcess}
          disabled={!stagedFile || uploading}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base transition-all"
          style={{
            background: stagedFile && !uploading ? "#171412" : "#d7cebf",
            color: stagedFile && !uploading ? "#f7f1e7" : "#83786c",
            boxShadow: "none",
            cursor: stagedFile && !uploading ? "pointer" : "not-allowed",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          <Play className="w-5 h-5" style={{ flexShrink: 0 }} />
          {uploading ? "Uploading…" : stagedFile ? `Process Video` : "Select a video first"}
        </button>
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
          style={{ background: "rgba(184,84,48,0.06)", border: "1px solid rgba(184,84,48,0.18)", color: "#b85430" }}
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
          progress={uploading ? uploadPct : pollState.progress}
          message={uploading ? `Uploading your video… ${uploadPct}%` : pollState.message}
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
