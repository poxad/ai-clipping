"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { getTikTokAccounts, schedulePost } from "@/lib/api";
import type { Clip, TikTokAccount } from "@/lib/types";

interface Props {
  clip: Clip;
  jobId: string;
  onClose: () => void;
  onScheduled: () => void;
}

function toLocalDateTimeDefaults() {
  const d = new Date(Date.now() + 3600_000);
  const date = d.toISOString().slice(0, 10);
  const time = d.toTimeString().slice(0, 5);
  return { date, time };
}

export function ScheduleModal({ clip, jobId, onClose, onScheduled }: Props) {
  const [accounts, setAccounts] = useState<TikTokAccount[]>([]);
  const [accountId, setAccountId] = useState("");
  const defaults = toLocalDateTimeDefaults();
  const [date, setDate] = useState(defaults.date);
  const [time, setTime] = useState(defaults.time);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  useEffect(() => {
    getTikTokAccounts()
      .then((accs) => {
        setAccounts(accs);
        if (accs.length > 0) setAccountId(accs[0].id);
      })
      .catch(() => setError("Failed to load TikTok accounts"))
      .finally(() => setLoadingAccounts(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accountId) return;
    setError(null);
    setLoading(true);
    try {
      const scheduledAt = Math.floor(new Date(`${date}T${time}`).getTime() / 1000);
      const clipFileName = clip.name || clip.url?.split("/").pop() || "";
      await schedulePost(jobId, clipFileName, accountId, scheduledAt, clip.transcript, clip.caption ?? undefined);
      onScheduled();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    background: "#fbf7f1",
    border: "1px solid #d7cebf",
    color: "#171412",
    borderRadius: 8,
    padding: "8px 12px",
    fontSize: 13,
    width: "100%",
    outline: "none",
  } as React.CSSProperties;

  const labelStyle = {
    fontSize: 11,
    fontWeight: 600,
    color: "#83786c",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    display: "block",
    marginBottom: 6,
  };

  return (
    <Modal title="Schedule Post" onClose={onClose}>
      {/* Clip preview */}
      <div
        className="flex items-center gap-3 mb-5 px-3 py-2.5 rounded-lg"
        style={{ background: "#f7f1e7", border: "1px solid #d7cebf" }}
      >
        <span className="text-xs font-mono font-medium" style={{ color: "#b85430" }}>
          {clip.name || `Clip #${clip.index}`}
        </span>
        {clip.score != null && (
          <span className="text-xs font-bold" style={{ color: "#16a34a" }}>
            ★ {clip.score.toFixed(1)}
          </span>
        )}
        {clip.clip_type && (
          <span className="text-xs" style={{ color: "#83786c" }}>{clip.clip_type}</span>
        )}
      </div>

      {clip.caption && (
        <div
          className="mb-5 px-3 py-2.5 rounded-lg text-xs"
          style={{ background: "#f7f1e7", border: "1px solid #d7cebf", color: "#171412", lineHeight: 1.6 }}
        >
          <div className="text-xs font-semibold mb-1" style={{ color: "#83786c" }}>CAPTION</div>
          {clip.caption}
        </div>
      )}

      {error && (
        <div
          className="mb-4 px-3 py-2 rounded-lg text-xs"
          style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.18)" }}
        >
          {error}
        </div>
      )}

      {loadingAccounts ? (
        <p className="text-xs text-center py-4" style={{ color: "#83786c" }}>Loading accounts…</p>
      ) : accounts.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm mb-2" style={{ color: "#5e554d" }}>No TikTok accounts connected.</p>
          <a href="/scheduler" className="text-xs font-semibold" style={{ color: "#b85430" }}>
            → Connect an account in Scheduler
          </a>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label style={labelStyle}>TikTok Account</label>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={inputStyle}>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  @{acc.display_name || acc.open_id}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label style={labelStyle}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={inputStyle} />
            </div>
            <div className="flex-1">
              <label style={labelStyle}>Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} required style={inputStyle} />
            </div>
          </div>

          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ background: "#f7f1e7", border: "1px solid #d7cebf", color: "#5e554d" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !accountId}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50"
              style={{ background: "#171412", color: "#f7f1e7" }}
            >
              {loading ? "Scheduling…" : "Schedule"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
