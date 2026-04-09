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
          background: showSidebar ? "#f7f6f3" : "transparent",
        }}
      >
        {children}
      </main>
    </>
  );
}
