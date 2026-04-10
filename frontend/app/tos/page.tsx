import Link from "next/link";
import { ArrowLeft, Scissors } from "lucide-react";

const sections = [
  {
    title: "1. Acceptance of Terms",
    body: "By accessing or using Jumo, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the service.",
  },
  {
    title: "2. Description of Service",
    body: "Jumo is an AI-powered video clipping service that automatically transcribes, clips, and formats video content for TikTok and other short-form platforms. The service is provided as-is and may change at any time.",
  },
  {
    title: "3. User Accounts",
    body: "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.",
  },
  {
    title: "4. Content Ownership",
    body: "You retain all ownership rights to videos you upload. By uploading content, you grant Jumo a limited license to process and store your content solely for the purpose of providing the service. You are solely responsible for ensuring you have the right to upload any content.",
  },
  {
    title: "5. Acceptable Use",
    body: "You agree not to upload content that is illegal, harmful, or violates the rights of others. You agree not to use the service for spam, harassment, or any unlawful purpose. We reserve the right to suspend accounts that violate these terms.",
  },
  {
    title: "6. Service Availability",
    body: "We do not guarantee uninterrupted access to Jumo. The service may be temporarily unavailable due to maintenance, updates, or factors outside our control. We are not liable for any losses resulting from service unavailability.",
  },
  {
    title: "7. Limitation of Liability",
    body: "To the maximum extent permitted by law, Jumo is not liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.",
  },
  {
    title: "8. Changes to Terms",
    body: "We may update these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms. We will notify registered users of material changes via email.",
  },
  {
    title: "9. Contact",
    body: "For questions about these Terms of Service, contact us at legal@jumo.app.",
  },
];

export default function TosPage() {
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
          <h1 style={{ fontSize: "clamp(34px, 5vw, 48px)", fontWeight: 900, letterSpacing: "-0.05em", marginBottom: 8 }}>Terms of Service</h1>
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
            <Link href="/privacy" style={{ fontSize: 13, color: "#194e56", textDecoration: "none", fontWeight: 700 }}>
              Privacy Policy
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
