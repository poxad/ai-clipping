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
    <div style={{ minHeight: "100vh", width: "100%", padding: 24, display: "flex", alignItems: "center", justifyContent: "center", background: "#f3ede3" }}>
      <div className="grid w-full max-w-[980px] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
        <div className="panel" style={{ padding: "32px 30px" }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 12, textDecoration: "none", marginBottom: 24, color: "inherit" }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: "#171412", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Scissors size={16} color="#f7f1e7" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 19, letterSpacing: "-0.03em" }}>Jumo Clip</span>
          </Link>

          <div className="eyebrow">Account setup</div>
          <h1 className="editorial-title" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", marginTop: 12, maxWidth: 540 }}>
            Create access for the clipping workspace.
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: "#5e554d", marginTop: 16, maxWidth: 520 }}>
            Set up your account to upload footage, generate clips, review edits, and schedule posts in one calmer interface.
          </p>
        </div>

        <div className="panel" style={{ padding: "30px 26px" }}>
          <div className="eyebrow">New account</div>
          <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.03em", marginTop: 10, color: "#171412" }}>Create your account</h2>
          <p style={{ fontSize: 14, color: "#83786c", marginTop: 8, marginBottom: 22 }}>Start using Jumo Clip for clip production and review.</p>

          {success ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ width: 54, height: 54, borderRadius: 18, background: "rgba(44,106,80,0.12)", color: "#2c6a50", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 14 }}>✓</div>
              <p style={{ fontSize: 15, color: "#171412", fontWeight: 700 }}>Account created</p>
              <p style={{ fontSize: 13, color: "#83786c", marginTop: 6 }}>Redirecting to the workspace...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Field label="Full name">
                <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
              </Field>
              <Field label="Email">
                <input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} />
              </Field>
              <Field label="Password">
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} style={inputStyle} />
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
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>
          )}

          <p style={{ fontSize: 13, color: "#83786c", textAlign: "center", marginTop: 20 }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#b85430", textDecoration: "none", fontWeight: 700 }}>Log in</Link>
          </p>

          <p style={{ fontSize: 11, color: "#83786c", textAlign: "center", marginTop: 14, lineHeight: 1.7 }}>
            By signing up, you agree to our{" "}
            <Link href="/tos" style={{ color: "#5e554d", textDecoration: "none", fontWeight: 700 }}>Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" style={{ color: "#5e554d", textDecoration: "none", fontWeight: 700 }}>Privacy Policy</Link>.
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
