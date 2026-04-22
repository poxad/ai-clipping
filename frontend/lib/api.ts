import type { JobState, StylePayload, TikTokAccount, ScheduledPost } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function toAssColor(hex: string): string {
  const h = hex.replace("#", "");
  const r = h.substring(0, 2).toUpperCase();
  const g = h.substring(2, 4).toUpperCase();
  const b = h.substring(4, 6).toUpperCase();
  return `&H00${b}${g}${r}`;
}

export function styleToPayload(style: {
  language: string;
  font: string;
  textColor: string;
  bold?: boolean;
  italic: boolean;
  textCase: string;
  fontSize: number;
  letterSpacing?: number;
  alignment?: "left" | "center" | "right";
  hasOutline: boolean;
  outlineColor: string;
  outlineWidth?: number;
  shadowSize?: number;
  shadowX?: number;
  shadowY?: number;
  shadowColor?: string;
  hasBg?: boolean;
  bgColor?: string;
  bgOpacity?: number;
  marginV: number;
  contentType?: "retail" | "podcast" | "general";
  whisperVocab?: string;
}): StylePayload {
  return {
    language: style.language as "en" | "id",
    font: style.font,
    primary_color: toAssColor(style.textColor),
    bold: style.bold ?? true,
    italic: style.italic,
    text_case: style.textCase as "none" | "uppercase" | "lowercase",
    font_size: style.fontSize,
    letter_spacing: style.letterSpacing ?? 0,
    alignment: style.alignment ?? "center",
    has_outline: style.hasOutline,
    outline_color: toAssColor(style.outlineColor),
    outline_width: style.outlineWidth ?? 0,
    shadow_size: style.shadowSize ?? 2,
    shadow_x: style.shadowX ?? 0,
    shadow_y: style.shadowY ?? 0,
    shadow_color: style.shadowColor ? toAssColor(style.shadowColor) : "&H00000000",
    has_bg: style.hasBg ?? false,
    bg_color: style.bgColor ? toAssColor(style.bgColor) : "&H00000000",
    bg_opacity: style.bgOpacity ?? 60,
    margin_v: style.marginV,
    content_type: style.contentType ?? "retail",
    whisper_prompt: style.whisperVocab
      ? style.whisperVocab.split("\n").map((s) => s.trim()).filter(Boolean).join(",")
      : undefined,
  };
}

async function getAuthToken(): Promise<string | null> {
  const { createClient } = await import("./supabase");
  const sb = createClient();
  const { data } = await sb.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function uploadSingle(
  file: File,
  style: StylePayload,
  onProgress?: (pct: number) => void,
): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("style", JSON.stringify(style));
  const token = await getAuthToken();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE}/api/upload`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText).job_id);
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed: network error"));
    xhr.send(fd);
  });
}

export async function uploadBatch(files: File[], style: StylePayload): Promise<string> {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  fd.append("style", JSON.stringify(style));
  const token = await getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api/upload-batch`, { method: "POST", body: fd, headers });
  if (!res.ok) throw new Error(`Batch upload failed: ${res.statusText}`);
  const data = await res.json();
  return data.job_id;
}

export async function getStatus(jobId: string): Promise<JobState> {
  const res = await fetch(`${BASE}/api/status/${jobId}`);
  if (!res.ok) throw new Error(`Status check failed: ${res.statusText}`);
  return res.json();
}

export async function deleteJob(jobId: string): Promise<void> {
  const token = await getAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE}/api/jobs/${jobId}`, { method: "DELETE", headers });
  if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`);
}

export async function reprocess(sourceJobId: string, style: StylePayload): Promise<string> {
  const fd = new FormData();
  fd.append("style", JSON.stringify(style));
  const res = await fetch(`${BASE}/api/reprocess/${sourceJobId}`, { method: "POST", body: fd });
  if (!res.ok) throw new Error(`Reprocess failed: ${res.statusText}`);
  const data = await res.json();
  return data.job_id;
}

// ─── TikTok accounts ─────────────────────────────────────────────────────────

export async function getTikTokAuthUrl(): Promise<{ url: string }> {
  const res = await fetch(`${BASE}/api/tiktok/auth-url`);
  if (!res.ok) throw new Error(`Failed to get auth URL: ${res.statusText}`);
  return res.json();
}

export async function getTikTokAccounts(): Promise<TikTokAccount[]> {
  const res = await fetch(`${BASE}/api/tiktok/accounts`);
  if (!res.ok) throw new Error(`Failed to load accounts: ${res.statusText}`);
  return res.json();
}

export async function deleteTikTokAccount(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/tiktok/accounts/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to remove account: ${res.statusText}`);
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export async function schedulePost(
  jobId: string,
  clipName: string,
  accountId: string,
  scheduledAt: number,
  transcript?: string,
  caption?: string,
): Promise<{ id: string }> {
  const res = await fetch(`${BASE}/api/schedule`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId, clip_name: clipName, account_id: accountId, scheduled_at: scheduledAt, transcript, caption }),
  });
  if (!res.ok) throw new Error(`Schedule failed: ${res.statusText}`);
  return res.json();
}

export async function getSchedule(): Promise<ScheduledPost[]> {
  const res = await fetch(`${BASE}/api/schedule`);
  if (!res.ok) throw new Error(`Failed to load schedule: ${res.statusText}`);
  return res.json();
}

export async function cancelScheduledPost(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/schedule/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Cancel failed: ${res.statusText}`);
}

export async function updateScheduledPost(id: string, scheduledAt: number): Promise<void> {
  const res = await fetch(`${BASE}/api/schedule/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scheduled_at: scheduledAt }),
  });
  if (!res.ok) throw new Error(`Update failed: ${res.statusText}`);
}

export async function deleteScheduledPost(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/schedule/${id}/delete`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Delete failed: ${res.statusText}`);
}

export async function postNow(id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/schedule/${id}/post-now`, { method: "POST" });
  if (!res.ok) throw new Error(`Post now failed: ${res.statusText}`);
}

// ─── Video helpers ────────────────────────────────────────────────────────────

export interface WordEntry {
  word: string;
  start: number;
  end: number;
}

export async function getWords(jobId: string, clipFileName: string): Promise<WordEntry[]> {
  const res = await fetch(`${BASE}/api/words/${jobId}/${clipFileName}`);
  if (!res.ok) throw new Error(`Failed to load words: ${res.statusText}`);
  return res.json();
}

export async function rerenderSubtitles(jobId: string, clipFileName: string, style: StylePayload, wordOverrides?: WordEntry[]): Promise<void> {
  const body: Record<string, unknown> = {
    font: style.font,
    primary_color: style.primary_color,
    bold: style.bold ?? true,
    italic: style.italic,
    text_case: style.text_case,
    font_size: style.font_size,
    letter_spacing: style.letter_spacing ?? 0,
    alignment: style.alignment ?? "center",
    has_outline: style.has_outline,
    outline_color: style.outline_color,
    outline_width: style.outline_width ?? 0,
    shadow_size: style.shadow_size ?? 2,
    shadow_x: style.shadow_x ?? 0,
    shadow_y: style.shadow_y ?? 0,
    shadow_color: style.shadow_color ?? "&H00000000",
    has_bg: style.has_bg ?? false,
    bg_color: style.bg_color ?? "&H00000000",
    bg_opacity: style.bg_opacity ?? 60,
    margin_v: style.margin_v,
    language: style.language,
  };
  if (wordOverrides) body.word_overrides = wordOverrides;
  const res = await fetch(`${BASE}/api/render-subtitles/${jobId}/${clipFileName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Render failed: ${res.statusText}`);
}

export function clipName(clip: { name?: string; url?: string }): string {
  if (clip.name) return clip.name;
  if (clip.url) return clip.url.split("/").pop() ?? "";
  return "";
}

export function videoUrl(jobId: string, name: string): string {
  return `${BASE}/api/video/${jobId}/${name}`;
}

export function thumbnailUrl(jobId: string, name: string): string {
  return `${BASE}/api/thumbnail/${jobId}/${name}`;
}

export function downloadAllUrl(jobId: string): string {
  return `${BASE}/api/download/${jobId}`;
}
