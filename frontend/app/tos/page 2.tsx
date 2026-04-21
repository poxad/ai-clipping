import Link from "next/link";
import { ArrowLeft, Scissors } from "lucide-react";

const sections = [
  {
    title: "1. Scope of These Terms",
    paragraphs: [
      "These Terms of Service apply to Jumo, currently available at https://jumoclip.vercel.app and any successor domain or subdomain we operate for the same service.",
      "By accessing or using Jumo, you agree to these Terms. If you do not agree, do not use the service.",
    ],
  },
  {
    title: "2. Description of Service",
    paragraphs: [
      "Jumo is a video clipping and publishing workspace that helps users upload source videos, generate short clips, edit subtitles and captions, review outputs, connect a TikTok account through TikTok Login Kit, and schedule or publish selected clips through TikTok's official Content Posting API.",
      "Jumo is intended for creators, brands, teams, and operators who are posting content they own or are authorized to manage.",
    ],
  },
  {
    title: "3. Accounts and Eligibility",
    paragraphs: [
      "You are responsible for maintaining the confidentiality of your login credentials and for activity that occurs under your account.",
      "You may only connect a TikTok account that you own or are authorized to manage. You must provide accurate information and comply with applicable law and TikTok platform terms when using any TikTok-connected features.",
    ],
  },
  {
    title: "4. User Content and Permissions",
    paragraphs: [
      "You retain ownership of the videos, audio, captions, transcripts, and other content you upload or create through Jumo.",
      "You grant Jumo a limited permission to host, process, transform, store, and transmit that content only as needed to operate the service, including clip generation, subtitle rendering, scheduling, and publishing actions that you request.",
      "You represent that you have all rights, licenses, consents, and permissions necessary to upload, process, and publish your content.",
    ],
  },
  {
    title: "5. TikTok Login Kit and Content Posting API",
    paragraphs: [
      "If you choose to connect your TikTok account, Jumo uses TikTok Login Kit to authenticate you and receive the permissions needed to show your connected account inside the product and to enable user-initiated posting or scheduling.",
      "Jumo uses TikTok's Content Posting API only to upload or publish clips that you explicitly select inside the product. Jumo does not publish content to your TikTok account without a direct action you take, such as scheduling a post or triggering an immediate post.",
      "You may disconnect a TikTok account from Jumo, and scheduled posts can be edited or deleted inside the product before publishing where supported.",
    ],
  },
  {
    title: "6. Acceptable Use",
    paragraphs: [
      "You may not use Jumo to violate law, infringe intellectual property or privacy rights, distribute malware, commit fraud, spam users, scrape data without authorization, or interfere with the normal operation of the service.",
      "You may not use Jumo or any connected TikTok functionality to submit misleading, deceptive, unlawful, abusive, or platform-violating content. You remain solely responsible for what you choose to upload, schedule, or publish.",
    ],
  },
  {
    title: "7. Third-Party Services",
    paragraphs: [
      "Jumo relies on third-party providers to operate parts of the service, including infrastructure, authentication, storage, transcription, and official TikTok platform integrations.",
      "Your use of connected services such as TikTok is also subject to the terms, policies, and developer requirements of those third parties.",
    ],
  },
  {
    title: "8. Suspension and Termination",
    paragraphs: [
      "We may suspend or terminate access to Jumo if we reasonably believe you have violated these Terms, created security risk, misused the platform, or exposed us or our partners to legal or compliance risk.",
      "You may stop using the service at any time. Provisions that by their nature should survive termination will continue to apply, including provisions on ownership, disclaimers, limitations of liability, and disputes.",
    ],
  },
  {
    title: "9. Service Availability and Disclaimer",
    paragraphs: [
      "Jumo is provided on an as-is and as-available basis. We may update, modify, pause, or discontinue parts of the service at any time.",
      "We do not guarantee uninterrupted availability, successful processing of every upload, or successful publishing through third-party APIs that are outside our control.",
    ],
  },
  {
    title: "10. Limitation of Liability",
    paragraphs: [
      "To the maximum extent permitted by law, Jumo and its operators will not be liable for any indirect, incidental, special, consequential, exemplary, or punitive damages, or for any loss of profits, revenues, data, goodwill, or business opportunities arising from or related to your use of the service.",
    ],
  },
  {
    title: "11. Changes to These Terms",
    paragraphs: [
      "We may update these Terms from time to time. The updated version becomes effective when posted on this page unless a later date is stated.",
      "Your continued use of Jumo after revised Terms take effect means you accept the updated Terms.",
    ],
  },
  {
    title: "12. Contact",
    paragraphs: [
      "Questions about these Terms or about TikTok-related functionality can be sent to jonartojason@gmail.com.",
    ],
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
