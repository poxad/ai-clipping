import { BookOpen } from "lucide-react";

const SCORE_RANGES = [
  { range: "9 – 10", label: "Instant viral", desc: "Strong hook, emotional peak, satisfying close. Will be shared.", color: "#16a34a", bg: "rgba(22,163,74,0.07)", border: "rgba(22,163,74,0.2)" },
  { range: "7 – 8",  label: "Worth posting", desc: "Clear story, good energy. Solid content for daily posting.", color: "#16a34a", bg: "rgba(22,163,74,0.04)", border: "rgba(22,163,74,0.15)" },
  { range: "5 – 6",  label: "Decent",        desc: "Watchable but missing a strong hook or emotional payoff.", color: "#d97706", bg: "rgba(217,119,6,0.06)", border: "rgba(217,119,6,0.2)" },
  { range: "4 – 5",  label: "Coverage clip", desc: "A required moment (greeting, checkout) with low energy. You decide.", color: "#d97706", bg: "rgba(217,119,6,0.04)", border: "rgba(217,119,6,0.15)" },
  { range: "< 4",    label: "Skipped",       desc: "Filler, silence, or incomprehensible content. Not included.", color: "#dc2626", bg: "rgba(220,38,38,0.04)", border: "rgba(220,38,38,0.15)" },
];

const METRICS = [
  { name: "Virality", weight: "35%", desc: "How shareable and attention-grabbing is it? Does it have a strong hook or memorable moment that makes a stranger stop scrolling?" },
  { name: "Coherence", weight: "30%", desc: "Does it make sense as a standalone clip? Is the story complete — someone who's never seen the video should follow it easily." },
  { name: "Energy", weight: "20%", desc: "Is the pacing engaging? Is there emotional resonance — warmth, humor, excitement, or a genuine human moment?" },
  { name: "Completeness", weight: "15%", desc: "Does it have a clear start and end? Not cut off mid-sentence, not fading out awkwardly." },
];

const CLIP_TYPES = [
  { type: "STORY", emoji: "📖", desc: "Full customer arc: warm welcome → helpful service → satisfying close." },
  { type: "TRANSFORMATION", emoji: "✨", desc: "Customer tries on glasses and reacts. The before-and-after reveal moment." },
  { type: "EXPERTISE", emoji: "🎓", desc: "Staff drops product knowledge that surprises or impresses the customer." },
  { type: "REACTION", emoji: "😲", desc: "A genuine emotional peak — laughter, surprise, relief, or excitement." },
  { type: "HUMOR", emoji: "😄", desc: "A funny exchange or relatable moment. Feels spontaneous, not scripted." },
  { type: "SATISFYING", emoji: "✅", desc: "A perfectly fitted frame, clean checkout, or precise product demo with tight rhythm." },
];

const PILLARS = [
  { name: "Greeting", desc: "Customer walking in, staff welcoming. Even a brief hello counts." },
  { name: "Expertise", desc: "Staff explaining a product, frame shape, lens type, or prescription." },
  { name: "Try-on / Reaction", desc: "Customer trying glasses and seeing the result. The emotional peak." },
  { name: "Checkout / Outro", desc: "Payment, thank you, goodbye — a satisfying resolution." },
];

export default function GuidePage() {
  return (
    <div className="flex w-full max-w-3xl flex-col gap-8 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2.5" style={{ color: "#1c1917" }}>
          <BookOpen className="w-6 h-6" style={{ color: "#6d28d9" }} />
          Scoring Guide
        </h1>
        <p className="text-sm mt-1" style={{ color: "#9e9b94" }}>
          How the AI grades and selects clips from your store recordings.
        </p>
      </div>

      {/* Score ranges */}
      <Section title="Score Ranges">
        <div className="flex flex-col gap-2">
          {SCORE_RANGES.map((s) => (
            <div
              key={s.range}
              className="flex items-start gap-4 px-4 py-3 rounded-xl"
              style={{ background: s.bg, border: `1px solid ${s.border}` }}
            >
              <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                <span className="text-sm font-bold tabular-nums w-12" style={{ color: s.color }}>{s.range}</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: s.border, color: s.color }}>{s.label}</span>
              </div>
              <p className="text-sm" style={{ color: "#706d67" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Scoring formula */}
      <Section title="Scoring Formula">
        <p className="text-sm mb-4" style={{ color: "#706d67" }}>
          Each clip is evaluated across 4 dimensions. The final score is a weighted average:
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {METRICS.map((m) => (
            <div
              key={m.name}
              className="px-4 py-3 rounded-xl flex flex-col gap-1"
              style={{ background: "#ffffff", border: "1px solid #e4e1da" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: "#1c1917" }}>{m.name}</span>
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(109,40,217,0.08)", color: "#6d28d9", border: "1px solid rgba(109,40,217,0.15)" }}
                >
                  {m.weight}
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#9e9b94" }}>{m.desc}</p>
            </div>
          ))}
        </div>
        <div
          className="mt-3 px-4 py-2.5 rounded-xl text-xs font-mono"
          style={{ background: "#f7f6f3", border: "1px solid #e4e1da", color: "#706d67" }}
        >
          score = virality×0.35 + coherence×0.30 + energy×0.20 + completeness×0.15
        </div>
      </Section>

      {/* Clip types */}
      <Section title="Clip Types">
        <p className="text-sm mb-4" style={{ color: "#706d67" }}>
          The AI identifies and labels each clip with one of these types based on its content.
        </p>
        <div className="flex flex-col gap-2">
          {CLIP_TYPES.map((c) => (
            <div
              key={c.type}
              className="flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{ background: "#ffffff", border: "1px solid #e4e1da" }}
            >
              <span className="text-lg flex-shrink-0">{c.emoji}</span>
              <div>
                <span
                  className="inline-block text-xs font-bold px-2 py-0.5 rounded-md mb-1"
                  style={{ background: "rgba(109,40,217,0.08)", color: "#6d28d9" }}
                >
                  {c.type}
                </span>
                <p className="text-sm" style={{ color: "#706d67" }}>{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 4 pillars */}
      <Section title="The 4 Pillars">
        <p className="text-sm mb-4" style={{ color: "#706d67" }}>
          For retail content, the AI always tries to find clips covering all 4 of these moments — even if some score lower than others.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PILLARS.map((p, i) => (
            <div
              key={p.name}
              className="px-4 py-3 rounded-xl"
              style={{ background: "#ffffff", border: "1px solid #e4e1da" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "rgba(109,40,217,0.1)", color: "#6d28d9" }}
                >
                  {i + 1}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#1c1917" }}>{p.name}</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#9e9b94" }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Hook science */}
      <Section title="What Makes a Strong Hook">
        <div className="flex flex-col gap-2">
          <Row good label="Energetic greeting or product reveal" />
          <Row good label="Surprising statement or direct question" />
          <Row good label="Customer reacting to something unexpected" />
          <Row good label="Bold, punchy opener that creates curiosity" />
          <Row label="Mid-sentence fragments or bland transitions" />
          <Row label='"Um", "ya ya", or generic filler words' />
          <Row label="Long setups with no immediate payoff" />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "#9e9b94" }}>{title}</h2>
      {children}
    </div>
  );
}

function Row({ label, good }: { label: string; good?: boolean }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm"
      style={{
        background: good ? "rgba(22,163,74,0.04)" : "rgba(220,38,38,0.04)",
        border: `1px solid ${good ? "rgba(22,163,74,0.15)" : "rgba(220,38,38,0.12)"}`,
        color: "#706d67",
      }}
    >
      <span className="text-base flex-shrink-0">{good ? "✅" : "❌"}</span>
      {label}
    </div>
  );
}
