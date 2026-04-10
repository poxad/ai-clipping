"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Scissors } from "lucide-react";
import { Sidebar } from "./Sidebar";

const NO_SIDEBAR = ["/", "/privacy", "/tos", "/login", "/register"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = !NO_SIDEBAR.includes(pathname);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const handleClose = useCallback(() => setMobileNavOpen(false), []);

  const titleMap: Record<string, string> = {
    "/upload": "Upload & Clip",
    "/history": "History",
    "/scheduler": "Scheduler",
    "/guide": "Scoring Guide",
    "/settings": "Settings",
  };

  const pageTitle = titleMap[pathname] ?? "Workspace";

  return (
    <>
      {showSidebar && <Sidebar mobileOpen={mobileNavOpen} onClose={handleClose} />}
      {showSidebar && (
        <div
          className="fixed inset-x-0 top-0 z-30 border-b px-4 py-3 lg:hidden"
          style={{
            background: "rgba(251,248,242,0.94)",
            borderColor: "#ddd4c5",
            backdropFilter: "blur(18px)",
          }}
        >
          <div className="relative flex min-h-10 items-center justify-center">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border"
            style={{ borderColor: "#ddd4c5", background: "rgba(255,253,248,0.9)", color: "#194e56" }}
            aria-label="Open navigation"
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="pointer-events-none min-w-0 px-14 text-center">
            <div className="font-display text-sm font-semibold" style={{ color: "#17242c", letterSpacing: "-0.02em" }}>
              {pageTitle}
            </div>
          </div>

          <Link
            href="/upload"
            className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border"
            style={{ borderColor: "#ddd4c5", background: "rgba(255,253,248,0.9)", color: "#194e56" }}
            aria-label="Go to upload"
          >
            <Scissors className="h-4 w-4" />
          </Link>
          </div>
        </div>
      )}
      <main
        className={`flex flex-1 justify-center ${showSidebar ? "pt-[68px] lg:ml-[var(--sidebar-w)] lg:pt-0" : ""}`}
        style={{
          minHeight: "100vh",
          background: showSidebar
            ? "linear-gradient(180deg, rgba(255,253,248,0.82), rgba(244,240,232,0.96))"
            : "transparent",
        }}
      >
        {children}
      </main>
    </>
  );
}
