"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Trash2, PlayCircle, RefreshCw, ChevronLeft, ChevronRight, Calendar, Pencil, Check, X } from "lucide-react";
import {
  getTikTokAccounts,
  deleteTikTokAccount,
  getTikTokAuthUrl,
  getSchedule,
  cancelScheduledPost,
  deleteScheduledPost,
  updateScheduledPost,
  postNow,
  thumbnailUrl,
} from "@/lib/api";
import type { TikTokAccount, ScheduledPost, ScheduledPostStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusMeta(status: ScheduledPostStatus) {
  const map: Record<ScheduledPostStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
    pending:   { label: "Pending",   color: "#d97706", bg: "rgba(217,119,6,0.08)",   border: "rgba(217,119,6,0.25)",   dot: "#f59e0b" },
    posting:   { label: "Posting…",  color: "#2563eb", bg: "rgba(37,99,235,0.08)",   border: "rgba(37,99,235,0.25)",   dot: "#3b82f6" },
    posted:    { label: "Posted",    color: "#16a34a", bg: "rgba(22,163,74,0.08)",   border: "rgba(22,163,74,0.25)",   dot: "#22c55e" },
    failed:    { label: "Failed",    color: "#dc2626", bg: "rgba(220,38,38,0.08)",   border: "rgba(220,38,38,0.25)",   dot: "#ef4444" },
    cancelled: { label: "Cancelled", color: "#9e9b94", bg: "rgba(158,155,148,0.08)", border: "rgba(158,155,148,0.25)", dot: "#d1d5db" },
  };
  return map[status] ?? map.pending;
}

function StatusBadge({ status }: { status: ScheduledPostStatus }) {
  const s = statusMeta(status);
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}
    >
      {s.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Accounts Panel
// ---------------------------------------------------------------------------

function AccountsPanel() {
  const [accounts, setAccounts] = useState<TikTokAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setAccounts(await getTikTokAccounts());
    } catch {
      setError("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAddAccount() {
    setAdding(true);
    setError(null);
    try {
      const { url } = await getTikTokAuthUrl();
      window.location.href = url;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setAdding(false);
    }
  }

  async function handleRemove(id: string) {
    try {
      await deleteTikTokAccount(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError("Failed to remove account");
    }
  }

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ border: "1px solid #e4e1da", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #e4e1da" }}>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "#1c1917" }}>TikTok Accounts</h2>
          <p className="text-xs mt-0.5" style={{ color: "#9e9b94" }}>{accounts.length} connected</p>
        </div>
        <button
          onClick={handleAddAccount}
          disabled={adding}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50 transition-all"
          style={{ background: "linear-gradient(135deg, #6d28d9, #e11d48)", color: "white" }}
        >
          {adding ? "Redirecting…" : "+ Add Account"}
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-lg text-xs"
          style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.18)" }}>
          {error}
        </div>
      )}

      <div className="p-4 flex flex-col gap-2">
        {loading ? (
          <p className="text-xs text-center py-4" style={{ color: "#9e9b94" }}>Loading…</p>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm mb-1" style={{ color: "#706d67" }}>No accounts connected yet</p>
            <p className="text-xs" style={{ color: "#9e9b94" }}>Click "+ Add Account" to authorize via OAuth</p>
          </div>
        ) : (
          accounts.map((acc) => (
            <div
              key={acc.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
              style={{ background: "#f7f6f3", border: "1px solid #e4e1da" }}
            >
              {acc.avatar_url ? (
                <img src={acc.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: "#efede8", color: "#706d67" }}>
                  {(acc.display_name || "@")[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: "#1c1917" }}>
                  @{acc.display_name || acc.open_id}
                </p>
              </div>
              <button
                onClick={() => handleRemove(acc.id)}
                className="p-1.5 rounded-lg transition-all hover:bg-red-50"
                style={{ color: "#cac7be" }}
                title="Remove account"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Month Calendar
// ---------------------------------------------------------------------------

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function MonthCalendar({
  posts,
  selectedDate,
  onSelectDate,
}: {
  posts: ScheduledPost[];
  selectedDate: Date | null;
  onSelectDate: (d: Date | null) => void;
}) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map posts to day keys
  const postsByDay = new Map<string, ScheduledPost[]>();
  posts.forEach((p) => {
    const d = new Date(p.scheduled_at * 1000);
    const k = dayKey(d);
    if (!postsByDay.has(k)) postsByDay.set(k, []);
    postsByDay.get(k)!.push(p);
  });

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const today = new Date();

  function handleDayClick(day: number) {
    const clicked = new Date(year, month, day);
    if (
      selectedDate &&
      selectedDate.getFullYear() === year &&
      selectedDate.getMonth() === month &&
      selectedDate.getDate() === day
    ) {
      onSelectDate(null);
    } else {
      onSelectDate(clicked);
    }
  }

  const monthLabel = viewDate.toLocaleString(undefined, { month: "long", year: "numeric" });

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="p-1.5 rounded-lg transition-all"
          style={{ color: "#706d67", background: "#f7f6f3", border: "1px solid #e4e1da" }}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold" style={{ color: "#1c1917" }}>{monthLabel}</span>
        <button
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="p-1.5 rounded-lg transition-all"
          style={{ color: "#706d67", background: "#f7f6f3", border: "1px solid #e4e1da" }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-xs font-semibold" style={{ color: "#9e9b94" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`pad-${i}`} />;

          const k = dayKey(new Date(year, month, day));
          const dayPosts = postsByDay.get(k) || [];
          const isToday =
            today.getFullYear() === year &&
            today.getMonth() === month &&
            today.getDate() === day;
          const isSelected =
            selectedDate &&
            selectedDate.getFullYear() === year &&
            selectedDate.getMonth() === month &&
            selectedDate.getDate() === day;

          // Collect unique status dot colors (max 3)
          const dots: string[] = [];
          const seen = new Set<string>();
          for (const p of dayPosts) {
            if (!seen.has(p.status)) {
              seen.add(p.status);
              dots.push(statusMeta(p.status).dot);
            }
            if (dots.length >= 3) break;
          }

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className="flex flex-col items-center justify-start rounded-lg py-1.5 transition-all"
              style={{
                minHeight: 48,
                background: isSelected
                  ? "rgba(109,40,217,0.1)"
                  : isToday
                  ? "rgba(109,40,217,0.04)"
                  : "transparent",
                border: isSelected
                  ? "1px solid rgba(109,40,217,0.3)"
                  : isToday
                  ? "1px solid rgba(109,40,217,0.15)"
                  : "1px solid transparent",
              }}
            >
              <span
                className="text-xs flex items-center justify-center rounded-full w-6 h-6"
                style={{
                  color: isSelected ? "#6d28d9" : isToday ? "#6d28d9" : "#1c1917",
                  fontWeight: isToday || isSelected ? 700 : 500,
                }}
              >
                {day}
              </span>
              {dots.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dots.map((color, j) => (
                    <div key={j} style={{ width: 5, height: 5, borderRadius: "50%", background: color }} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Schedule Calendar (calendar + day detail)
// ---------------------------------------------------------------------------

function ScheduleCalendar() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");

  const load = useCallback(async () => {
    try {
      setPosts(await getSchedule());
    } catch {
      setError("Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCancel(id: string) {
    setActioning(id);
    try { await cancelScheduledPost(id); await load(); }
    catch { setError("Cancel failed"); }
    finally { setActioning(null); }
  }

  function startEdit(post: ScheduledPost) {
    const d = new Date(post.scheduled_at * 1000);
    setEditDate(d.toISOString().slice(0, 10));
    setEditTime(d.toTimeString().slice(0, 5));
    setEditingId(post.id);
  }

  async function confirmEdit(id: string) {
    setActioning(id);
    try {
      const scheduledAt = Math.floor(new Date(`${editDate}T${editTime}`).getTime() / 1000);
      await updateScheduledPost(id, scheduledAt);
      setEditingId(null);
      await load();
    } catch { setError("Update failed"); }
    finally { setActioning(null); }
  }

  async function handleDelete(id: string) {
    setActioning(id);
    try { await deleteScheduledPost(id); await load(); }
    catch { setError("Delete failed"); }
    finally { setActioning(null); }
  }

  async function handlePostNow(id: string) {
    setActioning(id);
    try { await postNow(id); await load(); }
    catch { setError("Post now failed"); }
    finally { setActioning(null); }
  }

  // Filter posts for selected day, otherwise show all upcoming (pending/failed)
  const visiblePosts = selectedDate
    ? posts.filter((p) => {
        const d = new Date(p.scheduled_at * 1000);
        return (
          d.getFullYear() === selectedDate.getFullYear() &&
          d.getMonth() === selectedDate.getMonth() &&
          d.getDate() === selectedDate.getDate()
        );
      })
    : [...posts].sort((a, b) => a.scheduled_at - b.scheduled_at);

  const pendingCount = posts.filter((p) => p.status === "pending").length;

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ border: "1px solid #e4e1da", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #e4e1da" }}>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "#1c1917" }}>Schedule</h2>
          <p className="text-xs mt-0.5" style={{ color: "#9e9b94" }}>
            {pendingCount} pending · {posts.length} total
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg transition-all"
          style={{ color: "#9e9b94", border: "1px solid #e4e1da", background: "#f7f6f3" }}
          title="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-lg text-xs"
          style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.18)" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center">
          <p className="text-xs" style={{ color: "#9e9b94" }}>Loading…</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* Calendar */}
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #e4e1da" }}>
            <MonthCalendar
              posts={posts}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>

          {/* Day detail / full list */}
          <div className="flex flex-col gap-0" style={{ maxHeight: 340, overflowY: "auto" }}>
            {/* Section label */}
            <div
              className="flex items-center justify-between px-5 py-2.5 sticky top-0"
              style={{ background: "#fafaf8", borderBottom: "1px solid #e4e1da", zIndex: 1 }}
            >
              <span className="text-xs font-semibold" style={{ color: "#9e9b94" }}>
                {selectedDate
                  ? selectedDate.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
                  : "All Posts"}
              </span>
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-xs font-medium"
                  style={{ color: "#6d28d9" }}
                >
                  Show all
                </button>
              )}
            </div>

            {visiblePosts.length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="w-7 h-7 mx-auto mb-2" style={{ color: "#e4e1da" }} />
                <p className="text-sm" style={{ color: "#706d67" }}>
                  {selectedDate ? "Nothing scheduled this day" : "No posts scheduled yet"}
                </p>
                {!selectedDate && (
                  <p className="text-xs mt-1" style={{ color: "#9e9b94" }}>
                    Click "Schedule" on any clip to add it to the queue
                  </p>
                )}
              </div>
            ) : (
              visiblePosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-3 px-5 py-3"
                  style={{ borderBottom: "1px solid #f0ede8" }}
                >
                  {/* Time */}
                  {editingId === post.id ? (
                    <div className="flex flex-col gap-1 flex-shrink-0" style={{ width: 120 }}>
                      <input
                        type="date" value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="text-xs rounded-lg px-2 py-1 outline-none w-full"
                        style={{ border: "1px solid #6d28d9", color: "#1c1917", background: "#fff" }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <input
                        type="time" value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        className="text-xs rounded-lg px-2 py-1 outline-none w-full"
                        style={{ border: "1px solid #6d28d9", color: "#1c1917", background: "#fff" }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 text-right" style={{ width: 44 }}>
                      <span className="text-xs font-semibold tabular-nums" style={{ color: "#706d67" }}>
                        {new Date(post.scheduled_at * 1000).toLocaleTimeString(undefined, {
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                      {!selectedDate && (
                        <p className="text-xs" style={{ color: "#9e9b94" }}>
                          {new Date(post.scheduled_at * 1000).toLocaleDateString(undefined, {
                            month: "short", day: "numeric",
                          })}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Thumbnail */}
                  <div
                    className="flex-shrink-0 rounded-lg overflow-hidden"
                    style={{ width: 36, height: 52, background: "#111" }}
                  >
                    <img
                      src={thumbnailUrl(post.job_id, post.clip_name)}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate leading-snug" style={{ color: "#1c1917" }}>
                      {post.caption || post.transcript?.slice(0, 60) || post.clip_name}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: "#9e9b94" }}>
                      @{post.account.display_name || post.account.open_id}
                    </p>
                  </div>

                  <StatusBadge status={post.status} />

                  {post.error_message && (
                    <span title={post.error_message} className="text-xs cursor-help" style={{ color: "#dc2626" }}>⚠</span>
                  )}

                  <div className="flex gap-1 flex-shrink-0">
                    {editingId === post.id ? (
                      <>
                        <button
                          onClick={() => confirmEdit(post.id)}
                          disabled={actioning === post.id}
                          title="Save"
                          className="p-1.5 rounded-lg disabled:opacity-50"
                          style={{ color: "#16a34a", background: "rgba(22,163,74,0.08)" }}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          title="Cancel"
                          className="p-1.5 rounded-lg"
                          style={{ color: "#9e9b94" }}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        {(post.status === "pending" || post.status === "failed") && (
                          <>
                            <button
                              onClick={() => startEdit(post)}
                              title="Edit time"
                              className="p-1.5 rounded-lg transition-colors hover:bg-[#f0ede8]"
                              style={{ color: "#9e9b94" }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handlePostNow(post.id)}
                              disabled={actioning === post.id}
                              title="Post now"
                              className="p-1.5 rounded-lg disabled:opacity-50"
                              style={{ color: "#16a34a", background: "rgba(22,163,74,0.08)" }}
                            >
                              <PlayCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(post.id)}
                          disabled={actioning === post.id}
                          title="Delete"
                          className="p-1.5 rounded-lg disabled:opacity-50 hover:bg-red-50 transition-colors"
                          style={{ color: "#dc2626" }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Posting Logs
// ---------------------------------------------------------------------------

function PostingLogs() {
  const [logs, setLogs] = useState<ScheduledPost[]>([]);

  const loadLogs = useCallback(async () => {
    try {
      const allPosts = await getSchedule();
      const history = allPosts.filter(p => ["posting", "posted", "failed"].includes(p.status));
      setLogs(history.sort((a,b) => b.scheduled_at - a.scheduled_at));
    } catch {}
  }, []);

  useEffect(() => {
    loadLogs();
    const interval = setInterval(loadLogs, 5000);
    return () => clearInterval(interval);
  }, [loadLogs]);

  return (
    <div
      className="rounded-xl overflow-hidden flex flex-col"
      style={{ border: "1px solid #e4e1da", background: "#ffffff", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #e4e1da" }}>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "#1c1917" }}>Posting Logs</h2>
          <p className="text-xs mt-0.5" style={{ color: "#9e9b94" }}>Recent activity</p>
        </div>
        <div className="flex items-center gap-1.5" title="Auto-refreshing">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#22c55e" }} />
          <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: "#9e9b94" }}>Live</span>
        </div>
      </div>
      <div className="flex flex-col p-4 gap-2.5" style={{ maxHeight: 400, overflowY: "auto" }}>
        {logs.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm" style={{ color: "#706d67" }}>No posting activity yet</p>
          </div>
        ) : (
          logs.map(log => (
            <div key={`${log.id}-${log.status}`} className="flex flex-col gap-1.5 px-3 py-2.5 rounded-lg" style={{ background: "#f7f6f3", border: "1px solid #e4e1da" }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold truncate flex-1 pr-2" style={{ color: "#1c1917" }}>
                  {log.clip_name}
                </span>
                <StatusBadge status={log.status} />
              </div>
              <span className="text-[11px]" style={{ color: "#706d67" }}>
                @{log.account.display_name || log.account.open_id}
              </span>
              {log.error_message && (
                <div className="mt-0.5 px-2 py-1.5 rounded text-[11px] font-medium" style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.15)" }}>
                  {log.error_message}
                </div>
              )}
              {log.tiktok_publish_id && (
                <div className="mt-0.5 px-2 py-1.5 rounded text-[11px] font-medium" style={{ background: "rgba(22,163,74,0.06)", color: "#16a34a", border: "1px solid rgba(22,163,74,0.15)" }}>
                  Publish ID: {log.tiktok_publish_id}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function SchedulerPageInner() {
  const searchParams = useSearchParams();
  const connected = searchParams.get("connected");
  const oauthError = searchParams.get("error");

  return (
    <div className="flex flex-col gap-6 p-8 max-w-9xl w-full">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1c1917" }}>Scheduler</h1>
        <p className="text-sm mt-1" style={{ color: "#9e9b94" }}>
          Connect TikTok accounts and schedule clips for auto-posting
        </p>  
      </div>

      {connected && (
        <div
          className="px-4 py-3 rounded-lg text-sm font-medium"
          style={{ background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.25)", color: "#16a34a" }}
        >
          ✓ TikTok account connected successfully
        </div>
      )}
      {oauthError && (
        <div
          className="px-4 py-3 rounded-lg text-sm"
          style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)", color: "#dc2626" }}
        >
          ⚠ OAuth error: {oauthError}. Make sure TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET are set in .env
        </div>
      )}

      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 1.8fr" }}>
        <div className="flex flex-col gap-6">
          <AccountsPanel />
          <PostingLogs />
        </div>
        <ScheduleCalendar />
      </div>
    </div>
  );
}

export default function SchedulerPage() {
  return (
    <Suspense>
      <SchedulerPageInner />
    </Suspense>
  );
}
