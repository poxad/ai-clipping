"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Scissors, Upload, History, Settings, Calendar, BookOpen, LogOut, ChevronUp, User, X } from "lucide-react";
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

export function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
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

  // Close when navigating to a new page
  useEffect(() => {
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
    <>
      <div
        className={`fixed inset-0 z-40 bg-[rgba(23,36,44,0.38)] backdrop-blur-[2px] transition-opacity lg:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />
      <aside
        className={`sidebar-shell fixed top-0 left-0 z-50 flex h-screen flex-col transition-transform duration-300 ease-out lg:z-40 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        style={{
          background: "#f7f1e7",
          borderRight: "1px solid #d7cebf",
          boxShadow: "inset -1px 0 0 rgba(255,255,255,0.55)",
        }}
      >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid #d7cebf" }}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#171412", boxShadow: "0 10px 22px rgba(23,20,18,0.12)" }}
          >
            <Scissors className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-brand text-lg editorial-title" style={{ color: "#171412" }}>
              Jumo Clip
            </div>
            <div className="eyebrow" style={{ fontSize: 10 }}>
              Clipping workspace
            </div>
          </div>
        </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border lg:hidden"
            style={{ borderColor: "#d7cebf", background: "#fbf7f1", color: "#5e554d" }}
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>
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
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                color: active ? "#171412" : "#5e554d",
                background: active ? "rgba(184,84,48,0.06)" : "transparent",
                boxShadow: active ? "inset 0 0 0 1px rgba(184,84,48,0.18)" : "none",
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: active ? "rgba(184,84,48,0.12)" : "rgba(94,85,77,0.08)" }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: active ? "#b85430" : "#83786c" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs leading-tight" style={{ color: active ? "#171412" : "#171412", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
                <div className="text-xs leading-tight" style={{ color: "#83786c" }}>{desc}</div>
              </div>
              {/* {badge && history.length > 0 && (
                <span
                  className="text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: "rgba(184,84,48,0.1)", color: "#8c3e20", fontSize: "10px" }}
                >
                  {history.length}
                </span>
              )} */}
            </Link>
          );
        })}
      </nav>

      {/* Bottom stats */}
      {/* <div className="px-4 pt-4" style={{ borderTop: "1px solid #d7cebf" }}>
        <div
          className="rounded-xl px-3 py-3 flex flex-col gap-2"
          style={{ background: "#fbf7f1", border: "1px solid #d7cebf", boxShadow: "0 12px 28px rgba(23,20,18,0.04)" }}
        >
          <div className="eyebrow" style={{ fontSize: 10 }}>
            Stats
          </div>
          <StatRow label="Total clips" value={history.reduce((a, h) => a + h.count, 0)} />
          <StatRow label="Jobs processed" value={history.length} />
        </div>
      </div> */}

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
              background: "#fbf7f1",
              border: "1px solid #d7cebf",
              borderRadius: 14,
              boxShadow: "0 18px 44px rgba(23,20,18,0.12)",
              overflow: "hidden",
              zIndex: 50,
            }}
          >
            {/* User info */}
            <div className="px-4 py-3" style={{ borderBottom: "1px solid #f0e7d8" }}>
              <div className="text-xs font-bold" style={{ color: "#171412" }}>
                {user?.name || "Account"}
              </div>
              <div className="text-xs mt-0.5 truncate font-mono" style={{ color: "#83786c" }}>
                {user?.email || "Not logged in"}
              </div>
            </div>

            {/* Actions */}
            <div className="p-1.5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{ color: "#b85430", background: "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(184,84,48,0.08)")}
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
            background: open ? "rgba(184,84,48,0.05)" : "#fbf7f1",
            border: `1px solid ${open ? "rgba(184,84,48,0.16)" : "#d7cebf"}`,
            boxShadow: "0 12px 30px rgba(23,20,18,0.05)",
          }}
        >
          {/* Avatar */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
            style={{
              background: user
                ? "#171412"
                : "rgba(94,85,77,0.08)",
              color: user ? "#fff" : "#83786c",
            }}
          >
            {user ? initials : <User className="w-3.5 h-3.5" />}
          </div>

          {/* Name / email */}
          <div className="flex-1 min-w-0 text-left">
            <div className="text-xs font-semibold truncate" style={{ color: "#171412" }}>
              {user?.name || user?.email?.split("@")[0] || "Guest"}
            </div>
            <div className="text-xs truncate font-mono" style={{ color: "#83786c" }}>
              {user ? "Logged in" : "Not signed in"}
            </div>
          </div>

          <ChevronUp
            className="w-3.5 h-3.5 flex-shrink-0 transition-transform"
            style={{ color: "#bfb39e", transform: open ? "rotate(0deg)" : "rotate(180deg)" }}
          />
        </button>
      </div>
      </aside>
    </>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "#83786c" }}>{label}</span>
      <span
        className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full"
        style={{ background: "rgba(184,84,48,0.1)", color: "#8c3e20" }}
      >
        {value}
      </span>
    </div>
  );
}
