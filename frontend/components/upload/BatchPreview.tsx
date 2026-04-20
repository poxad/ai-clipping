"use client";

import { X, Upload } from "lucide-react";

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  files: File[];
  onClear: () => void;
  onUpload: () => void;
  uploading: boolean;
}

export function BatchPreview({ files, onClear, onUpload, uploading }: Props) {
  if (!files.length) return null;
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid #d7cebf", background: "#fbf7f1" }}
    >
      <div className="px-4 py-3" style={{ borderBottom: "1px solid #d7cebf", background: "#f7f1e7" }}>
        <span className="text-sm font-semibold" style={{ color: "#171412" }}>
          {files.length} video{files.length !== 1 ? "s" : ""} selected
        </span>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {files.map((f, i) => (
          <div
            key={i}
            className="flex items-start justify-between gap-3 px-4 py-2.5"
            style={{ borderBottom: i < files.length - 1 ? "1px solid #f0e7d8" : undefined }}
          >
            <span className="min-w-0 flex-1 text-sm break-words" style={{ color: "#171412" }}>
              {f.name}
            </span>
            <span className="text-xs ml-2 flex-shrink-0 tabular-nums font-mono" style={{ color: "#83786c" }}>
              {formatSize(f.size)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:justify-end" style={{ borderTop: "1px solid #d7cebf" }}>
        <button
          onClick={onClear}
          disabled={uploading}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ color: "#5e554d", border: "1px solid #d7cebf", background: "#fbf7f1" }}
        >
          <X className="w-3.5 h-3.5" /> Clear
        </button>
        <button
          onClick={onUpload}
          disabled={uploading}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: "#171412",
            color: "#f7f1e7",
            opacity: uploading ? 0.6 : 1,
          }}
        >
          <Upload className="w-3.5 h-3.5" />
          {uploading ? "Uploading..." : `Upload ${files.length} Video${files.length !== 1 ? "s" : ""}`}
        </button>
      </div>
    </div>
  );
}
