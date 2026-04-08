export interface Clip {
  name: string;           // "clip_001.mp4"
  index: number;          // 1-based
  url: string;            // "/api/video/{jobId}/clip_001.mp4"
  duration: number;
  transcript: string;
  source?: string | null;
  start?: number;
  end?: number;
  score?: number | null;
  score_summary?: string | null;
  caption?: string | null;
  clip_type?: string | null;
  score_metrics?: Record<string, unknown>;
}

export interface StylePayload {
  language: "en" | "id";
  font: string;
  primary_color: string;   // ASS &H00BBGGRR
  outline_color: string;
  has_outline: boolean;
  outline_width?: number;  // stroke thickness px
  shadow_size?: number;    // drop shadow distance
  shadow_x?: number;
  shadow_y?: number;
  shadow_color?: string;
  has_bg?: boolean;
  bg_color?: string;
  bg_opacity?: number;     // 0–100
  font_size: number;
  bold?: boolean;
  italic: boolean;
  letter_spacing?: number;
  alignment?: "left" | "center" | "right";
  text_case: "none" | "uppercase" | "lowercase";
  margin_v: number;
  content_type?: "retail" | "podcast";
  whisper_prompt?: string;
}

export type JobStatus =
  | "pending"
  | "uploading"
  | "extracting"
  | "transcribing"
  | "clipping"
  | "rendering"
  | "processing"
  | "done"
  | "error";

export interface JobState {
  status: JobStatus;
  progress: number;
  message: string;
  logs: string[];
  clips: Clip[];
}

export interface HistoryEntry {
  jobId: string;
  clips: Clip[];
  count: number;
  date: string;
  isBatch?: boolean;
}

export interface TikTokAccount {
  id: string;
  open_id: string;
  display_name: string;
  avatar_url?: string;
  created_at?: number;
}

export type ScheduledPostStatus = "pending" | "posting" | "posted" | "failed" | "cancelled";

export interface ScheduledPost {
  id: string;
  job_id: string;
  clip_name: string;
  caption?: string;
  transcript?: string;
  account: TikTokAccount;
  scheduled_at: number;   // unix timestamp
  status: ScheduledPostStatus;
  tiktok_publish_id?: string;
  error_message?: string;
  created_at: number;
}
