"use client";

import Link from "next/link";
import { Scissors } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const sb = createClient();
    const { error: err } = await sb.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      router.push("/upload");
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
      <div className="grid w-full max-w-[980px] gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,420px)]">
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
              Authenticated workspace
            </div>
            <h1 style={{ fontSize: "clamp(34px, 5vw, 54px)", lineHeight: 1.02, letterSpacing: "-0.06em", fontWeight: 900, color: "#17242c", marginTop: 14 }}>
              Sign in to manage clip production with a calmer, review-first workflow.
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "#5f6a6d", marginTop: 18 }}>
              Access upload, history, subtitle styling, and TikTok scheduling from one operational dashboard designed for professional short-form output.
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
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", color: "#17242c", marginBottom: 8 }}>Welcome back</h2>
          <p style={{ fontSize: 14, color: "#8c9186", marginBottom: 28 }}>Log in to continue to your Jumo workspace.</p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p style={{ fontSize: 13, color: "#8c9186", textAlign: "center", marginTop: 22 }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" style={{ color: "#194e56", textDecoration: "none", fontWeight: 700 }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
