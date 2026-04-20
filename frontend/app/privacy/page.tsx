import Link from "next/link";
import { ArrowLeft, Scissors } from "lucide-react";

const sections = [
  {
    title: "1. Information We Collect",
    body: "We collect information you provide directly when you create an account, upload videos, or contact support. This includes your email address, uploaded files, generated clip outputs, and basic usage activity such as timestamps and feature interactions.",
  },
  {
    title: "2. How We Use Information",
    body: "We use your information to provide, maintain, and improve Jumo Clip, including transcription, clip generation, account access, history, and scheduling-related workflows. We do not sell your personal information.",
  },
  {
    title: "3. Video Content",
    body: "Videos you upload are processed by our clipping pipeline and stored temporarily to generate outputs. Uploaded videos and generated clips are only accessible within your account context and are not used to train AI models.",
  },
  {
    title: "4. Third-Party Services",
    body: "We use OpenAI for audio transcription and generation-related tasks, and Supabase for authentication and storage. Those services process data only as needed to operate the product.",
  },
  {
    title: "5. Contact",
    body: "If you have questions about this Privacy Policy for Jumo Clip, contact privacy@jumo.app.",
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", width: "100%", color: "#171412", background: "#f3ede3" }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(18px)", background: "rgba(247,241,231,0.94)", borderBottom: "1px solid #d7cebf" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "18px 24px" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
            <div style={{ width: 34, height: 34, borderRadius: 12, background: "#171412", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Scissors size={14} color="#f7f1e7" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.03em" }}>Jumo Clip</span>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "38px 24px 72px" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#5e554d", textDecoration: "none", marginBottom: 24 }}>
          <ArrowLeft size={14} /> Back to home
        </Link>

        <div className="panel" style={{ padding: "30px 28px 36px" }}>
          <div className="eyebrow">Legal</div>
          <h1 className="editorial-title" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", marginTop: 10 }}>Privacy Policy</h1>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "#5e554d", marginTop: 12, marginBottom: 0 }}>
            This Privacy Policy explains how Jumo Clip collects, uses, and protects information when you use the app at https://jumoclip.vercel.app/.
          </p>
          <p style={{ fontSize: 13, color: "#83786c", marginTop: 8, marginBottom: 28 }}>Last updated: April 2026</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {sections.map(({ title, body }) => (
              <section key={title} style={{ paddingBottom: 20, borderBottom: "1px solid #f0e7d8" }}>
                <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 10, letterSpacing: "-0.02em" }}>{title}</h2>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: "#5e554d" }}>{body}</p>
              </section>
            ))}
          </div>

          <div style={{ marginTop: 24, display: "flex", gap: 20, flexWrap: "wrap" }}>
            <Link href="/tos" style={{ fontSize: 13, color: "#b85430", textDecoration: "none", fontWeight: 700 }}>Terms of Service</Link>
            <Link href="/" style={{ fontSize: 13, color: "#5e554d", textDecoration: "none", fontWeight: 700 }}>Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
