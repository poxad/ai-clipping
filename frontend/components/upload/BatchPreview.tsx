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
      style={{ border: "1px solid #e4e1da", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <div className="px-4 py-3" style={{ borderBottom: "1px solid #e4e1da", background: "#f7f6f3" }}>
        <span className="text-sm font-semibold" style={{ color: "#1c1917" }}>
          {files.length} video{files.length !== 1 ? "s" : ""} selected
        </span>
      </div>
      <div className="max-h-48 overflow-y-auto">
        {files.map((f, i) => (
          <div
            key={i}
            className="flex items-center justify-between px-4 py-2.5"
            style={{ borderBottom: i < files.length - 1 ? "1px solid #f0ede8" : undefined }}
          >
            <span className="text-sm truncate max-w-[70%]" style={{ color: "#1c1917" }}>
              {f.name}
            </span>
            <span className="text-xs ml-2 flex-shrink-0 tabular-nums" style={{ color: "#9e9b94" }}>
              {formatSize(f.size)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 px-4 py-3" style={{ borderTop: "1px solid #e4e1da" }}>
        <button
          onClick={onClear}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
          style={{ color: "#706d67", border: "1px solid #e4e1da", background: "#ffffff" }}
        >
          <X className="w-3.5 h-3.5" /> Clear
        </button>
        <button
          onClick={onUpload}
          disabled={uploading}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
          style={{
            background: "linear-gradient(135deg, #6d28d9, #e11d48)",
            color: "white",
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
