import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins, Inter, Montserrat, Roboto, Bebas_Neue, Anton } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { JobProvider } from "@/lib/JobContext";
import { JobToast } from "@/components/progress/JobToast";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
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
  metadataBase: new URL("https://jumoclip.vercel.app"),
  title: "Jumo Clip | Professional AI Video Clipping Workspace",
  description: "Jumo Clip lets you upload source videos, generate short clips, refine subtitles, review history, and manage TikTok scheduling from one workspace.",
  icons: {
    icon: "/jumo-logo.jpeg",
    shortcut: "/jumo-logo.jpeg",
    apple: "/jumo-logo.jpeg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} ${poppins.variable} ${inter.variable} ${montserrat.variable} ${roboto.variable} ${bebasNeue.variable} ${anton.variable} h-full`}>
      <body>
        <JobProvider>
          <AppShell>{children}</AppShell>
          <JobToast />
        </JobProvider>
      </body>
    </html>
  );
}
