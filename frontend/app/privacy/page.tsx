import Link from "next/link";
import { Scissors, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — Jumo",
};

export default function PrivacyPage() {
  return (
    <div style={{ background: "#09090b", minHeight: "100vh", color: "#ffffff", width: "100%" }}>

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(9,9,11,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 32px",
        display: "flex", alignItems: "center", gap: 12, height: 60,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, #6d28d9, #e11d48)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Scissors size={13} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: "-0.03em", color: "#fff" }}>Jumo</span>
        </Link>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "100px 32px 80px" }}>
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 13, color: "rgba(255,255,255,0.4)", textDecoration: "none", marginBottom: 40,
        }}>
          <ArrowLeft size={14} /> Back to home
        </Link>

        <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 8 }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 48 }}>Last updated: April 2026</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {[
            {
              title: "1. Information We Collect",
              body: "We collect information you provide directly to us when you create an account, upload videos, or contact support. This includes your email address, uploaded video files, and generated clip outputs. We also collect usage data such as features used and session timestamps.",
            },
            {
              title: "2. How We Use Your Information",
              body: "We use your information to provide, maintain, and improve the Jumo service — including transcribing your videos, generating clips, and storing your processing history. We do not sell your personal information to third parties.",
            },
            {
              title: "3. Video Content",
              body: "Videos you upload are processed by our AI pipeline and stored temporarily to generate clips. Uploaded videos and generated clips are stored on secure infrastructure and are only accessible by you. We do not use your video content to train AI models.",
            },
            {
              title: "4. Third-Party Services",
              body: "We use OpenAI's Whisper API for audio transcription. Audio extracted from your videos is sent to OpenAI for processing in accordance with their privacy policy. We use Supabase for authentication and database storage.",
            },
            {
              title: "5. Data Retention",
              body: "Uploaded videos and generated clips are retained for 30 days by default, after which they are automatically deleted. Your account information is retained until you delete your account.",
            },
            {
              title: "6. Security",
              body: "We implement industry-standard security measures to protect your information. All data is transmitted over HTTPS. However, no method of transmission or storage is 100% secure.",
            },
            {
              title: "7. Contact",
              body: "If you have questions about this Privacy Policy, please contact us at privacy@jumo.app.",
            },
          ].map(({ title, body }) => (
            <div key={title}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, letterSpacing: "-0.02em" }}>{title}</h2>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.5)" }}>{body}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 64, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 24 }}>
          <Link href="/tos" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Terms of Service</Link>
          <Link href="/" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Home</Link>
        </div>
      </div>
    </div>
  );
}
