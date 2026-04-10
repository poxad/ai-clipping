"use client";

import { useRef, useState } from "react";
import { CloudUpload, Film } from "lucide-react";

type Mode = "single" | "batch";

interface Props {
  mode: Mode;
  disabled: boolean;
  onSingleFile: (file: File) => void;
  onBatchFiles: (files: File[]) => void;
}

const ACCEPT = ".mp4,.mov,.avi,.mkv,.webm";

export function UploadZone({ mode, disabled, onSingleFile, onBatchFiles }: Props) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files?.length || disabled) return;
    if (mode === "single") {
      onSingleFile(files[0]);
    } else {
      onBatchFiles(Array.from(files).slice(0, 20));
    }
  }

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className="flex cursor-pointer flex-col items-center justify-center gap-5 rounded-2xl px-4 py-6 text-center transition-all sm:px-6"
      style={{
        minHeight: "220px",
        border: `2px dashed ${dragging ? "#6d28d9" : "#d4d0c9"}`,
        background: dragging
          ? "rgba(109,40,217,0.04)"
          : "linear-gradient(145deg, #ffffff 0%, #fafaf8 100%)",
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? "none" : "auto",
        boxShadow: dragging
          ? "0 0 0 4px rgba(109,40,217,0.08), 0 4px 16px rgba(0,0,0,0.06)"
          : "0 2px 8px rgba(0,0,0,0.04)",
        transition: "all 0.2s ease",
      }}
    >
      {/* Icon */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform"
        style={{
          background: dragging
            ? "rgba(109,40,217,0.12)"
            : "linear-gradient(135deg, rgba(109,40,217,0.08), rgba(225,29,72,0.06))",
          transform: dragging ? "scale(1.08)" : "scale(1)",
        }}
      >
        {dragging
          ? <CloudUpload className="w-7 h-7" style={{ color: "#6d28d9" }} />
          : <Film className="w-7 h-7" style={{ color: "#6d28d9" }} />
        }
      </div>

      {/* Text */}
      <div className="px-2 sm:px-6">
        <p className="font-bold text-base" style={{ color: "#1c1917" }}>
          {dragging ? "Drop it here!" : "Drop your video here"}
        </p>
        <p className="text-sm mt-1.5" style={{ color: "#9e9b94", lineHeight: 1.5 }}>
          {mode === "single"
            ? "Upload a store recording and AI will find the best moments"
            : "Upload multiple videos — AI will process them all"}
        </p>
      </div>

      {/* Button */}
      <button
        onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #6d28d9, #e11d48)",
          color: "white",
          boxShadow: "0 2px 12px rgba(109,40,217,0.3)",
        }}
      >
        <CloudUpload className="w-4 h-4" />
        Choose {mode === "batch" ? "Files" : "File"}
      </button>

      {/* Formats */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 px-2 sm:px-4">
        {["MP4", "MOV", "AVI", "MKV", "WebM"].map((ext) => (
          <span
            key={ext}
            className="px-2 py-0.5 rounded-md text-xs font-medium"
            style={{ background: "#f0ede8", color: "#9e9b94" }}
          >
            {ext}
          </span>
        ))}
        <span className="text-xs" style={{ color: "#c4c1bb" }}>
          · {mode === "batch" ? "up to 20 files" : "up to 2 GB"}
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple={mode === "batch"}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
