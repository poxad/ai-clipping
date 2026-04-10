import Link from "next/link";
import { ArrowRight, Scissors, Zap, Clock, TrendingUp } from "lucide-react";

export default function LandingPage() {
  return (
    <div style={{ background: "#09090b", minHeight: "100vh", color: "#ffffff", width: "100%" }}>

      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: "rgba(9,9,11,0.85)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "linear-gradient(135deg, #6d28d9, #e11d48)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 12px rgba(109,40,217,0.4)",
          }}>
            <Scissors size={15} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.03em" }}>Jumo</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* <Link
            href="/login"
            style={{
              padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
              color: "rgba(255,255,255,0.6)", textDecoration: "none", transition: "color 0.15s",
            }}
          >
            Log in
          </Link> */}
          <Link
            href="/upload"
            style={{
              padding: "8px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: "linear-gradient(135deg, #6d28d9, #7c3aed)",
              color: "#fff", textDecoration: "none",
              boxShadow: "0 2px 12px rgba(109,40,217,0.35)",
            }}
          >
            Dashboard
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{
        paddingTop: 160, paddingBottom: 120,
        textAlign: "center", maxWidth: 760, margin: "0 auto", padding: "160px 32px 120px",
      }}>
        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "6px 14px", borderRadius: 100,
          background: "rgba(109,40,217,0.15)", border: "1px solid rgba(109,40,217,0.3)",
          fontSize: 12, fontWeight: 600, color: "#a78bfa", marginBottom: 32,
        }}>
          <Zap size={12} />
          AI-powered video clipping
        </div>

        <h1 style={{
          fontSize: "clamp(40px, 6vw, 72px)",
          fontWeight: 900,
          lineHeight: 1.05,
          letterSpacing: "-0.04em",
          marginBottom: 24,
          background: "linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.6) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          Upload once.<br />Go viral 80 times.
        </h1>

        <p style={{
          fontSize: 18, lineHeight: 1.7, color: "rgba(255,255,255,0.45)",
          maxWidth: 540, margin: "0 auto 48px", fontWeight: 400,
        }}>
          Staff record customer service videos. Jumo transcribes, finds the best moments,
          and delivers ready-to-post TikTok clips — automatically.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/register"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 28px", borderRadius: 14, fontSize: 15, fontWeight: 700,
              background: "linear-gradient(135deg, #6d28d9, #7c3aed)",
              color: "#fff", textDecoration: "none",
              boxShadow: "0 4px 24px rgba(109,40,217,0.4)",
              letterSpacing: "-0.01em",
            }}
          >
            Start for free <ArrowRight size={16} />
          </Link>
          <Link
            href="/upload"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "14px 28px", borderRadius: 14, fontSize: 15, fontWeight: 600,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.7)", textDecoration: "none",
              letterSpacing: "-0.01em",
            }}
          >
            Try the app
          </Link>
        </div>
      </section>

      {/* Features */}
      <section style={{
        maxWidth: 1000, margin: "0 auto", padding: "0 32px 120px",
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16,
      }}>
        {[
          {
            icon: Zap,
            title: "Auto-transcribe & clip",
            desc: "Whisper AI transcribes your video in Indonesian. The engine finds natural scene breaks and cuts clips at the right moments.",
          },
          {
            icon: Clock,
            title: "15–30 second shorts",
            desc: "Every clip is sized for TikTok. Jump cuts remove dead air. Burned-in subtitles with your brand style.",
          },
          {
            icon: TrendingUp,
            title: "Built for 80 accounts",
            desc: "One upload produces clips ready to post across all your store accounts. Same content, zero extra work.",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div
            key={title}
            style={{
              padding: "28px 28px 32px",
              borderRadius: 18,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: "rgba(109,40,217,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 18,
            }}>
              <Icon size={18} color="#a78bfa" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, letterSpacing: "-0.02em" }}>{title}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.4)" }}>{desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 7,
            background: "linear-gradient(135deg, #6d28d9, #e11d48)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Scissors size={11} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-0.02em" }}>Jumo</span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", marginLeft: 4 }}>
            © {new Date().getFullYear()}
          </span>
        </div>

        <div style={{ display: "flex", gap: 24 }}>
          {[
            { href: "/tos", label: "Terms of Service" },
            { href: "/privacy", label: "Privacy Policy" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}
            >
              {label}
            </Link>
          ))}
        </div>
      </footer>
    </div>
  );
}
