import Link from "next/link";
import { Scissors } from "lucide-react";

export const metadata = { title: "Sign up — Jumo" };

export default function RegisterPage() {
  return (
    <div style={{ background: "#09090b", minHeight: "100vh", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, width: "100%" }}>
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 48 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6d28d9, #e11d48)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Scissors size={16} color="#fff" />
        </div>
        <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.03em", color: "#fff" }}>Jumo</span>
      </Link>

      <div style={{ width: "100%", maxWidth: 380, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "36px 32px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>Create your account</h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 32 }}>Start generating TikTok clips automatically</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6 }}>Full name</label>
            <input type="text" placeholder="Your name" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6 }}>Email</label>
            <input type="email" placeholder="you@example.com" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6 }}>Password</label>
            <input type="password" placeholder="••••••••" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>
          <button style={{ width: "100%", padding: "12px", borderRadius: 12, background: "linear-gradient(135deg, #6d28d9, #7c3aed)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", marginTop: 4 }}>
            Create account
          </button>
        </div>

        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", textAlign: "center", marginTop: 24 }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#a78bfa", textDecoration: "none", fontWeight: 600 }}>Log in</Link>
        </p>

        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", textAlign: "center", marginTop: 16, lineHeight: 1.6 }}>
          By signing up, you agree to our{" "}
          <Link href="/tos" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" style={{ color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Privacy Policy</Link>
        </p>
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>
        Supabase auth coming soon
      </p>
    </div>
  );
}
