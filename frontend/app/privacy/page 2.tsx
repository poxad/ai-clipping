import Link from "next/link";
import { ArrowLeft, Scissors } from "lucide-react";

const sections = [
  {
    title: "1. Scope of This Policy",
    paragraphs: [
      "This Privacy Policy applies to Jumo, currently available at https://jumoclip.vercel.app and any successor domain or subdomain we operate for the same service.",
      "It explains how we collect, use, store, and disclose information when you use Jumo, including when you connect a TikTok account through TikTok Login Kit or use TikTok-related posting features.",
    ],
  },
  {
    title: "2. Information We Collect",
    paragraphs: [
      "We collect information you provide directly to us, including your email address, authentication details needed to maintain your Jumo account, support communications, uploaded source videos, generated clips, captions, transcripts, subtitle settings, and scheduling preferences.",
      "We also collect service usage and technical data such as timestamps, job identifiers, processing states, browser or device metadata, and logs needed to secure, operate, and improve the service.",
    ],
  },
  {
    title: "3. TikTok Account Data",
    paragraphs: [
      "If you connect a TikTok account, we receive and store the account data and tokens necessary to support the TikTok features you choose to use. This may include your TikTok open_id, display name, avatar, access token, refresh token, token expiry information, and related posting status identifiers returned by TikTok.",
      "We use this information only to authenticate the connected account, display it inside the Jumo workspace, enable user-initiated scheduling and publishing, and maintain the connection while it remains active.",
    ],
  },
  {
    title: "4. How We Use Information",
    paragraphs: [
      "We use your information to provide and operate Jumo, including account access, video upload and storage, clip generation, subtitle rendering, caption generation, history review, scheduling, and publishing actions that you request.",
      "We also use information to secure the service, troubleshoot failures, monitor performance, prevent abuse, comply with legal obligations, and improve the product.",
      "We do not sell your personal information, and we do not use your uploaded videos or connected TikTok account data to train public foundation models.",
    ],
  },
  {
    title: "5. How TikTok Scopes Work in Jumo",
    paragraphs: [
      "TikTok Login Kit is used so a user can authenticate with TikTok and connect the correct TikTok account to Jumo.",
      "TikTok posting permissions are used only so the user can publish or schedule clips that the user has selected inside Jumo. Jumo does not automatically browse, edit, or publish unrelated content from the connected account.",
    ],
  },
  {
    title: "6. Sharing and Service Providers",
    paragraphs: [
      "We share information only as needed with service providers and infrastructure partners that help us run Jumo, such as hosting, authentication, storage, transcription, analytics, logging, and official platform integrations.",
      "For example, video or audio data may be processed by transcription or AI service providers only to perform the requested processing workflow. TikTok data is shared with TikTok only as required for authentication, account connection, and requested publishing actions.",
      "We may also disclose information when required by law, to protect rights and safety, or in connection with a merger, acquisition, financing, or sale of assets.",
    ],
  },
  {
    title: "7. Data Retention",
    paragraphs: [
      "We retain account and operational data for as long as reasonably necessary to provide the service, maintain security, comply with legal obligations, resolve disputes, and enforce our agreements.",
      "Uploaded media, generated clips, transcripts, scheduled post records, and TikTok connection records may be retained until they are deleted by the user, removed from the product, expire under internal retention practices, or are deleted following a verified request.",
    ],
  },
  {
    title: "8. Your Choices and Controls",
    paragraphs: [
      "You can choose whether to connect a TikTok account. If connected, you can disconnect the account from Jumo and stop using TikTok-linked features.",
      "You can also delete scheduled posts before publication where supported and contact us to request deletion of your Jumo account or associated data.",
    ],
  },
  {
    title: "9. Security",
    paragraphs: [
      "We use reasonable administrative, technical, and organizational measures to protect data, including HTTPS for data in transit and restricted access practices for stored data.",
      "No system is perfectly secure, so we cannot guarantee absolute security.",
    ],
  },
  {
    title: "10. Children's Privacy",
    paragraphs: [
      "Jumo is not directed to children, and we do not knowingly collect personal information from children in violation of applicable law.",
    ],
  },
  {
    title: "11. Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. The updated version becomes effective when posted on this page unless a later date is stated.",
    ],
  },
  {
    title: "12. Contact",
    paragraphs: [
      "For privacy questions, data deletion requests, or TikTok integration questions, contact jonartojason@gmail.com.",
    ],
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
          <p style={{ fontSize: 13, color: "#8c9186", marginBottom: 34 }}>Last updated: April 14, 2026</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            {sections.map(({ title, paragraphs }) => (
              <section key={title} style={{ paddingBottom: 24, borderBottom: "1px solid rgba(221,212,197,0.8)" }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 10, letterSpacing: "-0.02em" }}>{title}</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {paragraphs.map((paragraph) => (
                    <p key={paragraph} style={{ fontSize: 15, lineHeight: 1.8, color: "#5f6a6d" }}>
                      {paragraph}
                    </p>
                  ))}
                </div>
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
