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
            background: "rgba(247,241,231,0.96)",
            borderColor: "#d7cebf",
            backdropFilter: "blur(18px)",
          }}
        >
          <div className="relative flex min-h-10 items-center justify-center">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="absolute left-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border"
            style={{ borderColor: "#d7cebf", background: "#fbf7f1", color: "#171412" }}
            aria-label="Open navigation"
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="pointer-events-none min-w-0 px-14 text-center">
            <div className="text-sm font-semibold" style={{ color: "#171412", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {pageTitle}
            </div>
          </div>

          <Link
            href="/upload"
            className="absolute right-0 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border"
            style={{ borderColor: "#d7cebf", background: "#fbf7f1", color: "#171412" }}
            aria-label="Go to upload"
          >
            <Scissors className="h-4 w-4" />
          </Link>
          </div>
        </div>
      )}
      <main
        className={`min-h-screen w-full ${showSidebar ? "pt-[68px] lg:pl-[var(--sidebar-w)] lg:pt-0" : ""}`}
        style={{
          background: "transparent",
        }}
      >
        {children}
      </main>
    </>
  );
}
