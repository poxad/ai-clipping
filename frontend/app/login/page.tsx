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
    <div style={{ minHeight: "100vh", width: "100%", padding: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "#f3ede3" }}>
      <div className="grid w-full max-w-[980px] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <div className="panel" style={{ padding: "32px 30px" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none", marginBottom: 24, color: "inherit" }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "#171412", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Scissors size={16} color="#f7f1e7" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 19, letterSpacing: "-0.03em" }}>Jumo Clip</span>
          </Link>

          <div className="eyebrow">Authenticated workspace</div>
          <h1 className="editorial-title" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", marginTop: 12, maxWidth: 540 }}>
            Sign in to continue the clipping workflow.
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "#5e554d", marginTop: 16, maxWidth: 520 }}>
            Access upload, history, subtitle editing, and scheduling from the same workspace without the noise of the old visual system.
          </p>
        </div>

        <div className="panel" style={{ padding: "30px 26px" }}>
          <div className="eyebrow">Account access</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", marginTop: 10, color: "#171412" }}>Welcome back</h2>
          <p style={{ fontSize: 14, color: "#83786c", marginTop: 8, marginBottom: 22 }}>Log in to open your Jumo Clip workspace.</p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <Field label="Email">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
              />
            </Field>

            {error && (
              <p style={{ fontSize: 13, color: "#b85430", background: "rgba(184,84,48,0.08)", border: "1px solid rgba(184,84,48,0.16)", borderRadius: 12, padding: "10px 12px", margin: 0 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", padding: "13px", borderRadius: 16, background: "#171412", color: "#f7f1e7", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", border: "1px solid #171412", cursor: loading ? "not-allowed" : "pointer", marginTop: 4, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p style={{ fontSize: 13, color: "#83786c", textAlign: "center", marginTop: 20 }}>
            Don&apos;t have an account?{" "}
            <Link href="/register" style={{ color: "#b85430", textDecoration: "none", fontWeight: 700 }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 11, fontWeight: 600, color: "#83786c", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.12em" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  background: "#fbf7f1",
  border: "1px solid #d7cebf",
  color: "#171412",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};
