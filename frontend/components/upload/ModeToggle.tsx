"use client";

import { Film, Files } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Mode = "single" | "batch";

export function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <ToggleGroup
      {...({ type: "single", value: mode, onValueChange: (v: any) => { if (v === "single" || v === "batch") onChange(v as Mode) } } as any)}
      className="inline-flex rounded-xl p-1 gap-1"
      style={{ background: "#efede8", border: "1px solid #e4e1da" }}
    >
      <ToggleGroupItem
        value="single"
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
        style={{
          background: mode === "single" ? "#ffffff" : "transparent",
          color: mode === "single" ? "#1c1917" : "#9e9b94",
          boxShadow: mode === "single" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
        }}
      >
        <Film className="w-4 h-4" />
        Long Video
      </ToggleGroupItem>
      <ToggleGroupItem
        value="batch"
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
        style={{
          background: mode === "batch" ? "#ffffff" : "transparent",
          color: mode === "batch" ? "#1c1917" : "#9e9b94",
          boxShadow: mode === "batch" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
        }}
      >
        <Files className="w-4 h-4" />
        Multiple Short Videos
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
