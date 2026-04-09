import type { Metadata } from "next";
import { Inter, Poppins, Montserrat, Roboto, Bebas_Neue, Anton } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
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
  title: "AI Clipping — TikTok Auto-Clip",
  description: "Upload store videos. AI clips them into TikTok-ready shorts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} ${montserrat.variable} ${roboto.variable} ${bebasNeue.variable} ${anton.variable} h-full`}>
      <body style={{ background: "#f7f6f3", display: "flex", minHeight: "100vh" }}>
        <JobProvider>
          <Sidebar />
          <main
            className="flex-1 flex justify-center"
            style={{ marginLeft: "var(--sidebar-w)", minHeight: "100vh", background: "#f7f6f3" }}
          >
            {children}
          </main>
          <JobToast />
        </JobProvider>
      </body>
    </html>
  );
}
