import type { Metadata } from "next";
import { Inter, Poppins, Montserrat, Roboto, Bebas_Neue, Anton } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { JobProvider } from "@/lib/JobContext";
import { JobToast } from "@/components/progress/JobToast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-roboto",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-bebas-neue",
  display: "swap",
});

const anton = Anton({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-anton",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jumo | Professional AI Video Clipping Workspace",
  description: "Upload source videos, generate short clips, refine subtitles, review history, and manage TikTok scheduling from one workspace.",
  icons: {
    icon: "/jumo-logo.jpeg",
    shortcut: "/jumo-logo.jpeg",
    apple: "/jumo-logo.jpeg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} ${montserrat.variable} ${roboto.variable} ${bebasNeue.variable} ${anton.variable} h-full`}>
      <body style={{ display: "flex", minHeight: "100vh" }}>
        <JobProvider>
          <AppShell>{children}</AppShell>
          <JobToast />
        </JobProvider>
      </body>
    </html>
  );
}
