"use client";

import Link from "next/link";
import { Scissors } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const sb = createClient();
    const { error: err } = await sb.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/upload"), 1500);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        padding: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top left, rgba(185,135,82,0.14), transparent 28%), radial-gradient(circle at top right, rgba(25,78,86,0.09), transparent 26%), linear-gradient(180deg, #fbf8f2 0%, #f4f0e8 100%)",
      }}
    >
      <div className="grid w-full max-w-[980px] gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,420px)]">
        <div
          style={{
            padding: "34px 34px 36px",
            borderRadius: 30,
            background: "rgba(255,253,248,0.74)",
            border: "1px solid #ddd4c5",
            boxShadow: "0 30px 70px rgba(23,36,44,0.08)",
          }}
        >
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none", marginBottom: 28 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "linear-gradient(135deg, #194e56, #2b6670)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 28px rgba(25,78,86,0.18)" }}>
              <Scissors size={16} color="#fff" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 21, letterSpacing: "-0.03em", color: "#17242c" }}>Jumo</span>
          </Link>

          <div style={{ maxWidth: 520 }}>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em", color: "#8c9186", fontWeight: 700 }}>
              Account setup
            </div>
            <h1 style={{ fontSize: "clamp(34px, 5vw, 54px)", lineHeight: 1.02, letterSpacing: "-0.06em", fontWeight: 900, color: "#17242c", marginTop: 14 }}>
              Create an account for a more polished clipping and review workflow.
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "#5f6a6d", marginTop: 18 }}>
              Set up access to the Jumo workspace to upload videos, generate clips, review history, and manage scheduling from a single product environment.
            </p>
          </div>
        </div>

        <div
          style={{
            width: "100%",
            background: "rgba(255,253,248,0.9)",
            border: "1px solid #ddd4c5",
            borderRadius: 28,
            padding: "34px 30px",
            boxShadow: "0 28px 60px rgba(23,36,44,0.08)",
          }}
        >
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", color: "#17242c", marginBottom: 8 }}>Create your account</h2>
          <p style={{ fontSize: 14, color: "#8c9186", marginBottom: 28 }}>Start using the Jumo workspace for clip generation and review.</p>

          {success ? (
            <div style={{ textAlign: "center", padding: "28px 0" }}>
              <div style={{ width: 56, height: 56, borderRadius: 20, background: "rgba(47,122,95,0.12)", color: "#2f7a5f", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 14 }}>✓</div>
              <p style={{ fontSize: 15, color: "#17242c", fontWeight: 700 }}>Account created</p>
              <p style={{ fontSize: 13, color: "#8c9186", marginTop: 6 }}>Redirecting to the workspace...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5f6a6d", display: "block", marginBottom: 8 }}>Full name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 14, background: "#fffdf8", border: "1px solid #ddd4c5", color: "#17242c", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5f6a6d", display: "block", marginBottom: 8 }}>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 14, background: "#fffdf8", border: "1px solid #ddd4c5", color: "#17242c", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#5f6a6d", display: "block", marginBottom: 8 }}>Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 14, background: "#fffdf8", border: "1px solid #ddd4c5", color: "#17242c", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {error && (
                <p style={{ fontSize: 13, color: "#a14b43", background: "rgba(161,75,67,0.08)", border: "1px solid rgba(161,75,67,0.16)", borderRadius: 12, padding: "10px 12px", margin: 0 }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ width: "100%", padding: "13px", borderRadius: 16, background: loading ? "rgba(25,78,86,0.45)" : "linear-gradient(135deg, #194e56, #215c64)", color: "#fff", fontWeight: 800, fontSize: 14, border: "none", cursor: loading ? "not-allowed" : "pointer", marginTop: 6, boxShadow: "0 16px 34px rgba(25,78,86,0.18)" }}
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>
          )}

          <p style={{ fontSize: 13, color: "#8c9186", textAlign: "center", marginTop: 22 }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#194e56", textDecoration: "none", fontWeight: 700 }}>Log in</Link>
          </p>

          <p style={{ fontSize: 11, color: "#8c9186", textAlign: "center", marginTop: 16, lineHeight: 1.7 }}>
            By signing up, you agree to our{" "}
            <Link href="/tos" style={{ color: "#5f6a6d", textDecoration: "none", fontWeight: 700 }}>Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" style={{ color: "#5f6a6d", textDecoration: "none", fontWeight: 700 }}>Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
