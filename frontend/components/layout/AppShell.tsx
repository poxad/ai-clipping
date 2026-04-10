"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

const NO_SIDEBAR = ["/", "/privacy", "/tos", "/login", "/register"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showSidebar = !NO_SIDEBAR.includes(pathname);

  return (
    <>
      {showSidebar && <Sidebar />}
      <main
        className="flex-1 flex justify-center"
        style={{
          marginLeft: showSidebar ? "var(--sidebar-w)" : 0,
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
