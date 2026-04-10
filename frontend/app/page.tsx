import Link from "next/link";
import { ArrowRight, CalendarDays, Captions, Scissors, ShieldCheck, Sparkles } from "lucide-react";

const features = [
  {
    title: "Structured clipping workflow",
    body: "Upload one source recording and turn it into multiple reviewable short clips with a clear processing trail.",
  },
  {
    title: "Editable subtitle styling",
    body: "Apply reusable subtitle presets, adjust presentation details, and refine clip outputs before publishing.",
  },
  {
    title: "TikTok scheduling support",
    body: "Connect test accounts, review publish states, and manage scheduled posts from one workspace.",
  },
];

const trustItems = [
  "Purpose-built workflow for short-form retail and talk-based content",
  "Review, scoring, history, and scheduling in one authenticated product",
  "Designed as an operational tool rather than a one-off AI demo",
];

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        color: "#17242c",
        background:
          "radial-gradient(circle at top left, rgba(185,135,82,0.16), transparent 26%), radial-gradient(circle at 85% 10%, rgba(25,78,86,0.1), transparent 24%), linear-gradient(180deg, #fbf8f2 0%, #f4f0e8 100%)",
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
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "18px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "linear-gradient(135deg, #194e56, #2b6670)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 12px 28px rgba(25,78,86,0.2)",
              }}
            >
              <Scissors size={17} color="#fff" />
            </div>
            <div>
              <div className="font-brand" style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.05em", color: "#17242c" }}>Jumo</div>
              <div className="eyebrow" style={{ color: "#8c9186" }}>
                clipping platform
              </div>
            </div>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href="/login"
              style={{
                padding: "10px 16px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                color: "#5f6a6d",
                textDecoration: "none",
                border: "1px solid #ddd4c5",
                background: "rgba(255,253,248,0.8)",
              }}
            >
              Log in
            </Link>
            <Link
              href="/upload"
              style={{
                padding: "10px 18px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                color: "#ffffff",
                textDecoration: "none",
                background: "linear-gradient(135deg, #194e56, #215c64)",
                boxShadow: "0 14px 30px rgba(25,78,86,0.18)",
              }}
            >
              Open Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "88px 28px 54px" }}>
        <div
          className="grid lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]"
          style={{
            gap: 28,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              padding: "40px 42px",
              borderRadius: 32,
              background: "rgba(255,253,248,0.78)",
              border: "1px solid rgba(221,212,197,0.9)",
              boxShadow: "0 28px 80px rgba(23,36,44,0.08)",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 999,
                background: "rgba(25,78,86,0.08)",
                border: "1px solid rgba(25,78,86,0.12)",
                color: "#194e56",
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 24,
                letterSpacing: "0.02em",
              }}
            >
              <ShieldCheck size={14} />
              Professional clipping workflow for review-ready short-form content
            </div>

            <h1
              className="font-display"
              style={{
                fontSize: "clamp(44px, 6vw, 72px)",
                lineHeight: 0.94,
                letterSpacing: "-0.075em",
                fontWeight: 800,
                maxWidth: 760,
              }}
            >
              A cleaner way to turn source videos into publishable clips.
            </h1>

            <p
              style={{
                fontSize: 17,
                lineHeight: 1.85,
                color: "#5f6a6d",
                maxWidth: 620,
                marginTop: 22,
              }}
            >
              Jumo combines transcription, AI-assisted clip selection, subtitle styling, review history, and TikTok scheduling into a single workspace built for operational content teams.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 30 }}>
              <Link
                href="/upload"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 22px",
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  background: "linear-gradient(135deg, #194e56, #215c64)",
                  color: "#fff",
                  textDecoration: "none",
                  boxShadow: "0 18px 38px rgba(25,78,86,0.2)",
                }}
              >
                Launch Workspace <ArrowRight size={16} />
              </Link>
              <Link
                href="/guide"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 22px",
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  background: "rgba(255,253,248,0.9)",
                  color: "#17242c",
                  textDecoration: "none",
                  border: "1px solid #ddd4c5",
                }}
              >
                View Scoring Guide
              </Link>
            </div>

            <div
              className="grid sm:grid-cols-3"
              style={{
                marginTop: 34,
                gap: 14,
              }}
            >
              {[
                { value: "1", label: "workspace", detail: "for upload, review, history, and scheduling" },
                { value: "AI", label: "assisted", detail: "clip selection with human review still in control" },
                { value: "9:16", label: "output", detail: "vertical short-form delivery with styled subtitles" },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    padding: "16px 18px",
                    borderRadius: 22,
                    background: "rgba(244,240,232,0.72)",
                    border: "1px solid rgba(221,212,197,0.84)",
                  }}
                >
                  <div className="font-display" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.06em", color: "#194e56" }}>{item.value}</div>
                  <div className="eyebrow" style={{ color: "#17242c", marginTop: 6, letterSpacing: "0.1em" }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.6, color: "#8c9186", marginTop: 6 }}>{item.detail}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              borderRadius: 32,
              padding: 24,
              background: "linear-gradient(180deg, rgba(25,78,86,0.95), rgba(20,55,61,0.98))",
              color: "#f6f2ea",
              boxShadow: "0 28px 80px rgba(15,38,43,0.18)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 260,
                height: 260,
                borderRadius: "50%",
                background: "rgba(185,135,82,0.18)",
                top: -120,
                right: -70,
                filter: "blur(10px)",
              }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
                <div>
                  <div className="eyebrow" style={{ color: "rgba(246,242,234,0.7)" }}>
                    Product snapshot
                  </div>
                  <div className="font-display" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.05em", marginTop: 6 }}>
                    Built for real operational use
                  </div>
                </div>
                <Sparkles size={18} color="#d7b28a" />
              </div>

              <div
                style={{
                  borderRadius: 24,
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: 18,
                }}
              >
                {[
                  { icon: Scissors, title: "Clipping", body: "AI-assisted selection of short moments from longer recordings." },
                  { icon: Captions, title: "Subtitles", body: "Preset-based styling with editable presentation controls." },
                  { icon: CalendarDays, title: "Scheduling", body: "Connected TikTok account management and scheduled posting states." },
                ].map(({ icon: Icon, title, body }) => (
                  <div
                    key={title}
                    style={{
                      display: "flex",
                      gap: 14,
                      padding: "14px 0",
                      borderBottom: title === "Scheduling" ? "none" : "1px solid rgba(255,255,255,0.09)",
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 14,
                        background: "rgba(255,255,255,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} color="#f6f2ea" />
                    </div>
                    <div>
                      <div className="font-display" style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>{title}</div>
                      <div style={{ fontSize: 13, lineHeight: 1.75, color: "rgba(246,242,234,0.7)", marginTop: 4 }}>{body}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
                {trustItems.map((item) => (
                  <div
                    key={item}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 18,
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1180, margin: "0 auto", padding: "12px 28px 90px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 18,
          }}
        >
          {features.map((feature) => (
            <div
              key={feature.title}
              style={{
                padding: "26px 24px",
                borderRadius: 28,
                background: "rgba(255,253,248,0.76)",
                border: "1px solid #ddd4c5",
                boxShadow: "0 20px 52px rgba(23,36,44,0.06)",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  background: "rgba(25,78,86,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#b98752" }} />
              </div>
              <h2 className="font-display" style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.12 }}>{feature.title}</h2>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: "#5f6a6d", marginTop: 10 }}>{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{ borderTop: "1px solid rgba(221,212,197,0.9)" }}>
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "24px 28px 34px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 13, color: "#8c9186" }}>Jumo workspace for AI-assisted video clipping and review.</div>
          <div style={{ display: "flex", gap: 22 }}>
            <Link href="/tos" style={{ fontSize: 13, color: "#5f6a6d", textDecoration: "none" }}>
              Terms of Service
            </Link>
            <Link href="/privacy" style={{ fontSize: 13, color: "#5f6a6d", textDecoration: "none" }}>
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
