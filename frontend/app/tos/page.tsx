import Link from "next/link";
import { ArrowLeft, Scissors } from "lucide-react";

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing or using Jumo Clip, you agree to be bound by these Terms of Service. If you do not agree, please do not use the service.",
  },
  {
    title: "2. Description of Service",
    body: "Jumo Clip is an AI-assisted video clipping product that transcribes, selects, and renders short-form video outputs. The service may evolve over time as the product changes.",
  },
  {
    title: "3. User Accounts",
    body: "You are responsible for keeping your credentials secure and for activity that occurs under your account. Notify us promptly if you believe your account has been compromised.",
  },
  {
    title: "4. Content Ownership",
    body: "You retain ownership of the videos you upload. By uploading content, you grant Jumo Clip a limited license to process and store that content only as needed to provide the service.",
  },
  {
    title: "5. Contact",
    body: "For questions about these Terms of Service for Jumo Clip, contact legal@jumo.app.",
  },
];

export default function TosPage() {
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
          <h1 className="editorial-title" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", marginTop: 10 }}>Terms of Service</h1>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "#5e554d", marginTop: 12, marginBottom: 0 }}>
            These Terms of Service govern your use of Jumo Clip at https://jumoclip.vercel.app/.
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
            <Link href="/privacy" style={{ fontSize: 13, color: "#b85430", textDecoration: "none", fontWeight: 700 }}>Privacy Policy</Link>
            <Link href="/" style={{ fontSize: 13, color: "#5e554d", textDecoration: "none", fontWeight: 700 }}>Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
