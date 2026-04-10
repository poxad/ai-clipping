import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TOS",
};

export default function TosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
