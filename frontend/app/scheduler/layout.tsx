import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scheduler",
};

export default function SchedulerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
