"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Mic, Sparkles, Wand2, User, Mail, LogOut, Save, Check } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useUserSettings } from "@/lib/useUserSettings";

type ContentType = "retail" | "podcast" | "general";

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
    <div className="page-shell page-shell-reading flex flex-col gap-6">

      {/* Page header */}
      <div>
        <div className="eyebrow">Preferences</div>
        <h1 className="editorial-title mt-2 text-[clamp(2rem,3vw,3.25rem)]" style={{ color: "#171412" }}>
          Settings
        </h1>
        <p className="text-base mt-3" style={{ color: "#5e554d", lineHeight: 1.8 }}>
          Manage your account and default processing preferences.
        </p>
      </div>

      {/* Account section */}
      <div
        className="panel p-5 flex flex-col gap-4"
      >
        <div className="eyebrow">
          Account
        </div>

        {/* Avatar + info */}
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-base font-bold"
            style={{
              background: user
                ? "#171412"
                : "rgba(0,0,0,0.06)",
              color: user ? "#fff" : "#83786c",
              boxShadow: "none",
            }}
          >
            {user ? initials : <User className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold" style={{ color: "#171412" }}>
              {user?.name || user?.email?.split("@")[0] || "Guest"}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Mail className="w-3 h-3 flex-shrink-0" style={{ color: "#bfb39e" }} />
              <span className="text-xs truncate font-mono" style={{ color: "#83786c" }}>
                {user?.email || "Not signed in"}
              </span>
            </div>
          </div>
        </div>

        {/* Logout */}
        <div style={{ borderTop: "1px solid #f0e7d8", paddingTop: 16 }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition-all"
            style={{ color: "#b85430", background: "rgba(184,84,48,0.05)", border: "1px solid rgba(184,84,48,0.12)" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(184,84,48,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(184,84,48,0.05)")}
          >
            <LogOut className="w-3.5 h-3.5" />
            Log out
          </button>
        </div>
      </div>

      {/* Processing defaults section */}
      <div
        className="panel p-5 flex flex-col gap-5"
      >
        <div className="eyebrow">
          Processing Defaults
        </div>

        {/* Content type */}
        <div className="flex flex-col gap-2">
          <div className="text-sm font-semibold" style={{ color: "#171412" }}>Content Type</div>
          <div className="text-xs" style={{ color: "#83786c" }}>
            Helps the AI pick better clip boundaries and captions.
          </div>
          <div className="mt-1 grid grid-cols-1 gap-3 lg:grid-cols-3">
            {([
              { key: "retail",  icon: Store, label: "Employee Generated Content", desc: "Customer service, product demos, try-ons" },
              { key: "podcast", icon: Mic,   label: "Podcast / Talk",             desc: "Interviews, conversations, commentary" },
              { key: "general", icon: Sparkles, label: "General", desc: "Any footage type, broad short-form clip discovery" },
            ] as const).map(({ key, icon: Icon, label, desc }) => (
              <button
                key={key}
                onClick={() => setContentType(key)}
                className="flex items-start gap-3 px-4 py-3.5 rounded-xl text-left transition-all"
                style={{
                  background: contentType === key ? "rgba(184,84,48,0.05)" : "#f7f1e7",
                  border: `1px solid ${contentType === key ? "#b85430" : "#d7cebf"}`,
                  boxShadow: "none",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: contentType === key ? "rgba(184,84,48,0.12)" : "#f0e7d8" }}
                >
                  <Icon className="w-4 h-4" style={{ color: contentType === key ? "#b85430" : "#83786c" }} />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: "#171412" }}>
                    {label}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#83786c" }}>{desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Whisper vocab */}
        <div className="flex flex-col gap-2" style={{ borderTop: "1px solid #f0e7d8", paddingTop: 20 }}>
          <div className="flex items-center gap-2">
            <Wand2 className="w-3.5 h-3.5" style={{ color: "#b85430" }} />
            <div className="text-sm font-semibold" style={{ color: "#171412" }}>Brand Name Hints</div>
          </div>
          <div className="text-xs" style={{ color: "#83786c" }}>
            Add brand names, product names, or local words the AI might misspell — one per line. Applied to every upload by default.
          </div>
          <textarea
            value={whisperVocab}
            onChange={(e) => setWhisperVocab(e.target.value)}
            rows={5}
            placeholder={"Kacamata Moo\nlensa kontak\nsilinder\ncek mata"}
            className="w-full rounded-xl px-3 py-2.5 text-xs resize-none mt-1"
            style={{
              background: "#f7f1e7",
              border: "1px solid #d7cebf",
              color: "#171412",
              outline: "none",
              fontFamily: "var(--font-mono)",
              lineHeight: 1.6,
            }}
            onFocus={(e) => (e.currentTarget.style.border = "1px solid rgba(184,84,48,0.4)")}
            onBlur={(e) => (e.currentTarget.style.border = "1px solid #d7cebf")}
          />
        </div>

        {/* Save button */}
        <div className="flex justify-stretch sm:justify-end" style={{ borderTop: "1px solid #f0e7d8", paddingTop: 16 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: saved ? "rgba(44,106,80,0.08)" : "#171412",
              color: saved ? "#2c6a50" : "#f7f1e7",
              boxShadow: "none",
              opacity: saving ? 0.7 : 1,
              cursor: saving ? "not-allowed" : "pointer",
              border: saved ? "1px solid rgba(44,106,80,0.25)" : "1px solid #171412",
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
