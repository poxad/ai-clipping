"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Scissors, Upload, History, Settings, Calendar, BookOpen, LogOut, ChevronUp, User } from "lucide-react";
import { useHistory } from "@/lib/useHistory";
import { createClient } from "@/lib/supabase";
import { useEffect, useRef, useState } from "react";

const nav = [
  { href: "/upload", label: "Upload & Clip", desc: "Create new clips", icon: Upload },
  { href: "/history", label: "History", desc: "Past jobs", icon: History, badge: true },
  { href: "/scheduler", label: "Scheduler", desc: "TikTok posting", icon: Calendar },
  { href: "/guide", label: "Scoring Guide", desc: "How AI grades clips", icon: BookOpen },
  { href: "/settings", label: "Settings", desc: "Clip preferences", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { history } = useHistory();
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          email: data.user.email,
          name: data.user.user_metadata?.full_name,
        });
      }
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email,
          name: session.user.user_metadata?.full_name,
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleLogout() {
    const sb = createClient();
    await sb.auth.signOut();
    setOpen(false);
    router.push("/login");
  }

  // Avatar initials
  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : user?.email
    ? user.email[0].toUpperCase()
    : "?";

  return (
    <aside
      className="fixed top-0 left-0 h-screen flex flex-col z-40"
      style={{
        width: "var(--sidebar-w)",
        background: "linear-gradient(180deg, rgba(251,248,242,0.98), rgba(246,240,230,0.96))",
        borderRight: "1px solid #ddd4c5",
        boxShadow: "inset -1px 0 0 rgba(255,255,255,0.55)",
        backdropFilter: "blur(18px)",
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid #ddd4c5" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #194e56, #2b6670)", boxShadow: "0 10px 24px rgba(25,78,86,0.22)" }}
          >
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-brand text-sm" style={{ color: "#17242c", fontWeight: 800, letterSpacing: "-0.04em" }}>
              Jumo
            </div>
            <div className="eyebrow" style={{ color: "#8c9186", letterSpacing: "0.1em", fontSize: 10 }}>
              Clipping workspace
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
                color: active ? "#194e56" : "#5f6a6d",
                background: active ? "rgba(25,78,86,0.08)" : "transparent",
                boxShadow: active ? "inset 0 0 0 1px rgba(25,78,86,0.12), 0 8px 18px rgba(23,36,44,0.05)" : "none",
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: active ? "rgba(25,78,86,0.12)" : "rgba(95,106,109,0.08)" }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: active ? "#194e56" : "#8c9186" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display text-xs leading-tight" style={{ color: active ? "#194e56" : "#17242c", fontWeight: 700, letterSpacing: "-0.02em" }}>{label}</div>
                <div className="text-xs leading-tight" style={{ color: "#8c9186" }}>{desc}</div>
              </div>
              {badge && history.length > 0 && (
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: "rgba(185,135,82,0.16)", color: "#8c6030", fontSize: "10px" }}
                >
                  {history.length}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom stats */}
      <div className="px-4 pt-4" style={{ borderTop: "1px solid #ddd4c5" }}>
        <div
          className="rounded-xl px-3 py-3 flex flex-col gap-2"
          style={{ background: "rgba(255,253,248,0.9)", border: "1px solid #ddd4c5", boxShadow: "0 12px 28px rgba(23,36,44,0.05)" }}
        >
          <div className="eyebrow" style={{ color: "#8c9186", fontSize: 10, letterSpacing: "0.1em" }}>
            Stats
          </div>
          <StatRow label="Total clips" value={history.reduce((a, h) => a + h.count, 0)} />
          <StatRow label="Jobs processed" value={history.length} />
        </div>
      </div>

      {/* Profile */}
      <div className="px-4 py-4" ref={dropdownRef} style={{ position: "relative" }}>
        {/* Dropdown — anchored above the button */}
        {open && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(100% - 12px)",
              left: 16,
              right: 16,
              background: "#fffdf8",
              border: "1px solid #ddd4c5",
              borderRadius: 14,
              boxShadow: "0 18px 44px rgba(23,36,44,0.12)",
              overflow: "hidden",
              zIndex: 50,
            }}
          >
            {/* User info */}
            <div className="px-4 py-3" style={{ borderBottom: "1px solid #f0e9dc" }}>
              <div className="text-xs font-bold" style={{ color: "#17242c" }}>
                {user?.name || "Account"}
              </div>
              <div className="text-xs mt-0.5 truncate" style={{ color: "#8c9186" }}>
                {user?.email || "Not logged in"}
              </div>
            </div>

            {/* Actions */}
            <div className="p-1.5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{ color: "#a14b43", background: "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(161,75,67,0.08)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <LogOut className="w-3.5 h-3.5" />
                Log out
              </button>
            </div>
          </div>
        )}

        {/* Profile button */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
          style={{
            background: open ? "rgba(25,78,86,0.06)" : "rgba(255,253,248,0.92)",
            border: `1px solid ${open ? "rgba(25,78,86,0.16)" : "#ddd4c5"}`,
            boxShadow: "0 12px 30px rgba(23,36,44,0.05)",
          }}
        >
          {/* Avatar */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
            style={{
              background: user
                ? "linear-gradient(135deg, #194e56, #2b6670)"
                : "rgba(95,106,109,0.08)",
              color: user ? "#fff" : "#8c9186",
            }}
          >
            {user ? initials : <User className="w-3.5 h-3.5" />}
          </div>

          {/* Name / email */}
          <div className="flex-1 min-w-0 text-left">
            <div className="text-xs font-semibold truncate" style={{ color: "#17242c" }}>
              {user?.name || user?.email?.split("@")[0] || "Guest"}
            </div>
            <div className="text-xs truncate" style={{ color: "#8c9186" }}>
              {user ? "Logged in" : "Not signed in"}
            </div>
          </div>

          <ChevronUp
            className="w-3.5 h-3.5 flex-shrink-0 transition-transform"
            style={{ color: "#c7bcab", transform: open ? "rotate(0deg)" : "rotate(180deg)" }}
          />
        </button>
      </div>
    </aside>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "#8c9186" }}>{label}</span>
      <span
        className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full"
        style={{ background: "rgba(25,78,86,0.1)", color: "#194e56" }}
      >
        {value}
      </span>
    </div>
  );
}
