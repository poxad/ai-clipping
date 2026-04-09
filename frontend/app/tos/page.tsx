import Link from "next/link";
import { Scissors, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service — Jumo",
};

export default function TosPage() {
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

        <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 48 }}>Last updated: April 2026</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {[
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
          ].map(({ title, body }) => (
            <div key={title}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, letterSpacing: "-0.02em" }}>{title}</h2>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: "rgba(255,255,255,0.5)" }}>{body}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 64, paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 24 }}>
          <Link href="/privacy" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Privacy Policy</Link>
          <Link href="/" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Home</Link>
        </div>
      </div>
    </div>
  );
}
