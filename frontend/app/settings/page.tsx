"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Mic, Wand2, User, Mail, LogOut, Save, Check } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useUserSettings } from "@/lib/useUserSettings";

type ContentType = "retail" | "podcast";

export default function SettingsPage() {
  const router = useRouter();
  const { processingSettings, saveProcessingSettings, saving, loaded } = useUserSettings();

  const [contentType, setContentType] = useState<ContentType>("retail");
  const [whisperVocab, setWhisperVocab] = useState("kacamata moo\nwhatsapp");
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [saved, setSaved] = useState(false);

  // Load user from Supabase
  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({
          email: data.user.email,
          name: data.user.user_metadata?.full_name,
        });
      }
    });
  }, []);

  // Hydrate from saved settings once loaded
  useEffect(() => {
    if (!loaded) return;
    if (processingSettings?.contentType) setContentType(processingSettings.contentType);
    if (processingSettings?.whisperVocab !== undefined) setWhisperVocab(processingSettings.whisperVocab);
  }, [loaded]);

  async function handleSave() {
    await saveProcessingSettings({ contentType, whisperVocab });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleLogout() {
    const sb = createClient();
    await sb.auth.signOut();
    router.push("/login");
  }

  const initials = user?.name
    ? user.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()
    : user?.email
    ? user.email[0].toUpperCase()
    : "?";

  return (
    <div className="flex flex-col gap-6 p-8 max-w-2xl w-full">

      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "#1c1917", letterSpacing: "-0.02em" }}>
          Settings
        </h1>
        <p className="text-sm mt-1.5" style={{ color: "#9e9b94", lineHeight: 1.6 }}>
          Manage your account and default processing preferences.
        </p>
      </div>

      {/* Account section */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-4"
        style={{ background: "#ffffff", border: "1px solid #e4e1da", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
      >
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9e9b94" }}>
          Account
        </div>

        {/* Avatar + info */}
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-base font-bold"
            style={{
              background: user
                ? "linear-gradient(135deg, #6d28d9, #7c3aed)"
                : "rgba(0,0,0,0.06)",
              color: user ? "#fff" : "#9e9b94",
              boxShadow: user ? "0 4px 12px rgba(109,40,217,0.25)" : "none",
            }}
          >
            {user ? initials : <User className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold" style={{ color: "#1c1917" }}>
              {user?.name || user?.email?.split("@")[0] || "Guest"}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3 h-3 flex-shrink-0" style={{ color: "#c4c1bb" }} />
              <span className="text-xs truncate" style={{ color: "#9e9b94" }}>
                {user?.email || "Not signed in"}
              </span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div style={{ borderTop: "1px solid #f0ede8", paddingTop: 16 }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
            style={{ color: "#dc2626", background: "rgba(220,38,38,0.05)", border: "1px solid rgba(220,38,38,0.12)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220,38,38,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(220,38,38,0.05)")}
          >
            <LogOut className="w-3.5 h-3.5" />
            Log out
          </button>
        </div>
      </div>

      {/* Processing defaults section */}
      <div
        className="rounded-2xl p-5 flex flex-col gap-5"
        style={{ background: "#ffffff", border: "1px solid #e4e1da", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}
      >
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9e9b94" }}>
          Processing Defaults
        </div>

        {/* Content type */}
        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold" style={{ color: "#1c1917" }}>Content Type</div>
          <div className="text-xs" style={{ color: "#9e9b94" }}>
            Helps the AI pick better clip boundaries and captions.
          </div>
          <div className="grid grid-cols-2 gap-3 mt-1">
            {([
              { key: "retail",  icon: Store, label: "Employee Generated Content", desc: "Customer service, product demos, try-ons" },
              { key: "podcast", icon: Mic,   label: "Podcast / Talk",             desc: "Interviews, conversations, commentary" },
            ] as const).map(({ key, icon: Icon, label, desc }) => (
              <button
                key={key}
                onClick={() => setContentType(key)}
                className="flex items-start gap-3 px-4 py-3.5 rounded-xl text-left transition-all"
                style={{
                  background: contentType === key ? "rgba(109,40,217,0.06)" : "#fafaf8",
                  border: `2px solid ${contentType === key ? "#6d28d9" : "#e4e1da"}`,
                  boxShadow: contentType === key ? "0 0 0 3px rgba(109,40,217,0.08)" : "none",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: contentType === key ? "rgba(109,40,217,0.12)" : "#f0ede8" }}
                >
                  <Icon className="w-4 h-4" style={{ color: contentType === key ? "#6d28d9" : "#9e9b94" }} />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: contentType === key ? "#6d28d9" : "#1c1917" }}>
                    {label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#9e9b94" }}>{desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Whisper vocab */}
        <div className="flex flex-col gap-2" style={{ borderTop: "1px solid #f0ede8", paddingTop: 20 }}>
          <div className="flex items-center gap-2">
            <Wand2 className="w-3.5 h-3.5" style={{ color: "#6d28d9" }} />
            <div className="text-sm font-semibold" style={{ color: "#1c1917" }}>Brand Name Hints</div>
          </div>
          <div className="text-xs" style={{ color: "#9e9b94" }}>
            Add brand names, product names, or local words the AI might misspell — one per line. Applied to every upload by default.
          </div>
          <textarea
            value={whisperVocab}
            onChange={(e) => setWhisperVocab(e.target.value)}
            rows={5}
            placeholder={"Kacamata Moo\nlensa kontak\nsilinder\ncek mata"}
            className="w-full rounded-xl px-3 py-2.5 text-xs resize-none mt-1"
            style={{
              background: "#fafaf8",
              border: "1px solid #e4e1da",
              color: "#1c1917",
              outline: "none",
              fontFamily: "monospace",
              lineHeight: 1.6,
            }}
            onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(109,40,217,0.4)")}
            onBlur={(e) => (e.currentTarget.style.border = "1px solid #e4e1da")}
          />
        </div>

        {/* Save button */}
        <div className="flex justify-end" style={{ borderTop: "1px solid #f0ede8", paddingTop: 16 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: saved
                ? "rgba(22,163,74,0.1)"
                : "linear-gradient(135deg, #6d28d9, #7c3aed)",
              color: saved ? "#16a34a" : "#ffffff",
              boxShadow: saved ? "none" : "0 4px 14px rgba(109,40,217,0.3)",
              opacity: saving ? 0.7 : 1,
              cursor: saving ? "not-allowed" : "pointer",
              border: saved ? "1px solid rgba(22,163,74,0.25)" : "none",
            }}
          >
            {saved
              ? <><Check className="w-4 h-4" /> Saved</>
              : <><Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Changes"}</>
            }
          </button>
        </div>
      </div>

    </div>
  );
}
