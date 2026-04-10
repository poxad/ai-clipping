import Link from "next/link";
import { ArrowLeft, Scissors } from "lucide-react";

const sections = [
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
];

export default function PrivacyPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        color: "#17242c",
        background:
          "radial-gradient(circle at top left, rgba(185,135,82,0.14), transparent 28%), radial-gradient(circle at top right, rgba(25,78,86,0.08), transparent 25%), linear-gradient(180deg, #fbf8f2 0%, #f4f0e8 100%)",
      }}
    >
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(18px)",
          background: "rgba(251,248,242,0.84)",
          borderBottom: "1px solid rgba(221,212,197,0.9)",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "18px 28px" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{ width: 34, height: 34, borderRadius: 12, background: "linear-gradient(135deg, #194e56, #2b6670)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 28px rgba(25,78,86,0.16)" }}>
              <Scissors size={14} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.03em", color: "#17242c" }}>Jumo</span>
          </Link>
        </div>
      </nav>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "42px 28px 80px" }}>
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#5f6a6d", textDecoration: "none", marginBottom: 28 }}>
          <ArrowLeft size={14} /> Back to home
        </Link>

        <div style={{ padding: "34px 34px 40px", borderRadius: 30, background: "rgba(255,253,248,0.8)", border: "1px solid #ddd4c5", boxShadow: "0 30px 70px rgba(23,36,44,0.08)" }}>
          <h1 style={{ fontSize: "clamp(34px, 5vw, 48px)", fontWeight: 900, letterSpacing: "-0.05em", marginBottom: 8 }}>Privacy Policy</h1>
          <p style={{ fontSize: 13, color: "#8c9186", marginBottom: 34 }}>Last updated: April 2026</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            {sections.map(({ title, body }) => (
              <section key={title} style={{ paddingBottom: 24, borderBottom: "1px solid rgba(221,212,197,0.8)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, letterSpacing: "-0.02em" }}>{title}</h2>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: "#5f6a6d" }}>{body}</p>
              </section>
            ))}
          </div>

          <div style={{ marginTop: 28, display: "flex", gap: 22 }}>
            <Link href="/tos" style={{ fontSize: 13, color: "#194e56", textDecoration: "none", fontWeight: 700 }}>
              Terms of Service
            </Link>
            <Link href="/" style={{ fontSize: 13, color: "#5f6a6d", textDecoration: "none", fontWeight: 700 }}>
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
