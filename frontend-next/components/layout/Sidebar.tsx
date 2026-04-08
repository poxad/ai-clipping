"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scissors, Upload, History, Settings, Calendar, BookOpen } from "lucide-react";
import { useHistory } from "@/lib/useHistory";

const nav = [
  { href: "/", label: "Upload & Clip", desc: "Create new clips", icon: Upload },
  { href: "/history", label: "History", desc: "Past jobs", icon: History, badge: true },
  { href: "/scheduler", label: "Scheduler", desc: "TikTok posting", icon: Calendar },
  { href: "/guide", label: "Scoring Guide", desc: "How AI grades clips", icon: BookOpen },
  { href: "/settings", label: "Settings", desc: "Clip preferences", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { history } = useHistory();

  return (
    <aside
      className="fixed top-0 left-0 h-screen flex flex-col z-40"
      style={{ width: "var(--sidebar-w)", background: "#fafaf8", borderRight: "1px solid #e4e1da" }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid #e4e1da" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #6d28d9, #e11d48)", boxShadow: "0 2px 8px rgba(109,40,217,0.3)" }}
          >
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-sm" style={{ color: "#1c1917", letterSpacing: "-0.01em" }}>
              AI Clipping
            </div>
            <div className="text-xs" style={{ color: "#9e9b94" }}>
              Auto TikTok clips
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {nav.map(({ href, label, desc, icon: Icon, badge }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                color: active ? "#6d28d9" : "#706d67",
                background: active ? "rgba(109,40,217,0.08)" : "transparent",
                boxShadow: active ? "inset 0 0 0 1px rgba(109,40,217,0.15)" : "none",
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: active ? "rgba(109,40,217,0.12)" : "rgba(0,0,0,0.04)",
                }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: active ? "#6d28d9" : "#9e9b94" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold leading-tight" style={{ color: active ? "#6d28d9" : "#1c1917" }}>{label}</div>
                <div className="text-xs leading-tight" style={{ color: "#9e9b94" }}>{desc}</div>
              </div>
              {badge && history.length > 0 && (
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: "rgba(109,40,217,0.1)", color: "#6d28d9", fontSize: "10px" }}
                >
                  {history.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom stats */}
      <div className="px-4 py-4" style={{ borderTop: "1px solid #e4e1da" }}>
        <div
          className="rounded-xl px-3 py-3 flex flex-col gap-2"
          style={{ background: "#ffffff", border: "1px solid #e4e1da" }}
        >
          <div className="text-xs font-semibold" style={{ color: "#9e9b94", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Stats
          </div>
          <StatRow label="Total clips" value={history.reduce((a, h) => a + h.count, 0)} />
          <StatRow label="Jobs processed" value={history.length} />
        </div>
      </div>
    </aside>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "#9e9b94" }}>{label}</span>
      <span
        className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full"
        style={{ background: "rgba(109,40,217,0.08)", color: "#6d28d9" }}
      >
        {value}
      </span>
    </div>
  );
}
