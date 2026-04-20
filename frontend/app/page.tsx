import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Captions,
  CheckCircle2,
  Clock3,
  Mic,
  Scissors,
  ShieldCheck,
  Sparkles,
  Store,
} from "lucide-react";

const quickFacts = [
  { value: "3", label: "Content modes", detail: "retail, podcast, and general footage" },
  { value: "9:16", label: "Final output", detail: "vertical clips built for short-form publishing" },
  { value: "1", label: "Workspace", detail: "upload, review, subtitle editing, history, scheduling" },
];

const valueCards = [
  {
    icon: ShieldCheck,
    title: "Reviewable by design",
    body: "Every clip arrives with transcript context, score metadata, and a calmer interface for checking what the model actually chose.",
  },
  {
    icon: Captions,
    title: "Subtitle controls that stay readable",
    body: "Edit timing, text, font, outline, and layout without leaving the product or wrestling with a noisy motion-graphics UI.",
  },
  {
    icon: CalendarDays,
    title: "From generation to scheduling",
    body: "Keep clipping, history, and TikTok scheduling in one place so publish-ready assets do not get scattered across tools.",
  },
];

const workflow = [
  {
    numeral: "I",
    title: "Upload the raw recording",
    body: "Bring in store footage, podcasts, or general video. No pre-editing needed.",
  },
  {
    numeral: "II",
    title: "Generate candidate clips",
    body: "Jumo Clip transcribes the video, identifies strong moments, and builds vertical short-form outputs.",
  },
  {
    numeral: "III",
    title: "Refine and publish",
    body: "Adjust subtitles, review history, and move the selected clips into a scheduling workflow.",
  },
];

const useCases = [
  {
    icon: Store,
    title: "Retail and service footage",
    body: "Capture try-ons, consultations, product walkthroughs, and staff-customer moments without hand-cutting every clip.",
  },
  {
    icon: Mic,
    title: "Podcast and interview clips",
    body: "Turn longer conversations into portrait segments with subtitle styling and active-speaker reframing.",
  },
  {
    icon: Sparkles,
    title: "General short-form discovery",
    body: "Use the broader clip mode when the footage does not fit a single template and you still want strong highlight candidates.",
  },
];

const featureGrid = [
  "Word-level transcription cached for re-clipping",
  "Per-clip subtitle editing and style presets",
  "History view for generated jobs and outputs",
  "Portrait reframing for landscape source footage",
  "Caption metadata stored alongside clip records",
  "Integrated scheduling flow for downstream posting",
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#f3ede3", color: "#171412" }}>
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          backdropFilter: "blur(18px)",
          background: "rgba(247,241,231,0.94)",
          borderBottom: "1px solid #d7cebf",
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "inherit" }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "#171412",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Scissors size={16} color="#f7f1e7" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, letterSpacing: "-0.03em" }}>Jumo Clip</div>
              <div className="eyebrow" style={{ fontSize: 10 }}>Clipping workspace</div>
            </div>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <a href="#workflow" style={{ fontSize: 13, fontWeight: 600, color: "#5e554d", textDecoration: "none" }}>
              Workflow
            </a>
            <a href="#features" style={{ fontSize: 13, fontWeight: 600, color: "#5e554d", textDecoration: "none" }}>
              Features
            </a>
            <a href="#use-cases" style={{ fontSize: 13, fontWeight: 600, color: "#5e554d", textDecoration: "none" }}>
              Use cases
            </a>
            <a href="#faq" style={{ fontSize: 13, fontWeight: 600, color: "#5e554d", textDecoration: "none" }}>
              Why Jumo
            </a>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/login"
              style={{
                padding: "10px 14px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                color: "#171412",
                textDecoration: "none",
                border: "1px solid #d7cebf",
                background: "#fbf7f1",
              }}
            >
              Log in
            </Link>
            <Link
              href="/upload"
              style={{
                padding: "10px 16px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                color: "#f7f1e7",
                textDecoration: "none",
                background: "#171412",
              }}
            >
              Open Workspace
            </Link>
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "44px 24px 0" }}>
        <section
          className="grid gap-6 lg:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]"
          style={{ alignItems: "stretch" }}
        >
          <div className="panel" style={{ padding: "34px 32px" }}>
            <div className="eyebrow">Editorial Workshop</div>
            <h1
              className="editorial-title"
              style={{
                fontSize: "clamp(2.4rem, 4.5vw, 4.35rem)",
                marginTop: 12,
                maxWidth: 780,
              }}
            >
              Turn long footage into calmer, publish-ready short-form clips.
            </h1>
            <p style={{ fontSize: 16, lineHeight: 1.85, color: "#5e554d", marginTop: 18, maxWidth: 680 }}>
              Jumo Clip brings upload, clipping, subtitle refinement, history, and scheduling into one paper-native workspace. It is built for teams who want deliberate review, not noisy “viral growth” dashboards.
            </p>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
              <Link
                href="/upload"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "13px 18px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  background: "#171412",
                  color: "#f7f1e7",
                  textDecoration: "none",
                }}
              >
                Start clipping <ArrowRight size={15} />
              </Link>
              {/* <Link
                href="/guide"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "13px 18px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#171412",
                  textDecoration: "none",
                  border: "1px solid #d7cebf",
                  background: "#fbf7f1",
                }}
              >
                Read the guide
              </Link> */}
            </div>

            <div className="grid gap-3 sm:grid-cols-3" style={{ marginTop: 30 }}>
              {quickFacts.map((item) => (
                <div key={item.label} className="panel-muted" style={{ padding: "16px 18px" }}>
                  <div className="font-mono" style={{ fontSize: 20, fontWeight: 700, color: "#b85430" }}>{item.value}</div>
                  <div className="eyebrow" style={{ marginTop: 6 }}>{item.label}</div>
                  <div style={{ fontSize: 12, lineHeight: 1.6, color: "#83786c", marginTop: 6 }}>{item.detail}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 18 }}>
            <div className="eyebrow">Why teams use it</div>
            {valueCards.map(({ icon: Icon, title, body }) => (
              <div key={title} style={{ paddingBottom: 16, borderBottom: "1px solid #f0e7d8" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 12,
                      background: "rgba(184,84,48,0.08)",
                      color: "#b85430",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{title}</div>
                </div>
                <p style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, color: "#5e554d" }}>{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" style={{ marginTop: 52 }}>
          <div className="eyebrow">Workflow</div>
          <div className="grid gap-4 lg:grid-cols-3" style={{ marginTop: 14 }}>
            {workflow.map((item) => (
              <article key={item.title} className="panel" style={{ padding: 24 }}>
                <div className="step-marker">{item.numeral}</div>
                <h2 style={{ fontSize: 20, fontWeight: 650, letterSpacing: "-0.03em", marginTop: 12 }}>{item.title}</h2>
                <p style={{ fontSize: 14, lineHeight: 1.78, color: "#5e554d", marginTop: 10 }}>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="features" style={{ marginTop: 52 }} className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="panel" style={{ padding: 28 }}>
            <div className="eyebrow">Feature set</div>
            <h2 className="editorial-title" style={{ fontSize: "clamp(1.8rem,3vw,3rem)", marginTop: 12 }}>
              Built for deliberate editing, not just one-click exporting.
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.85, color: "#5e554d", marginTop: 14 }}>
              The workflow favors clarity at each step: ingest the footage, generate candidates, inspect the outputs, adjust subtitle treatment, and keep the resulting clips connected to their history and scheduling context.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 22, color: "#b85430", fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
              <Clock3 size={14} /> Review faster with less context switching
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {featureGrid.map((item) => (
              <div key={item} className="panel-muted" style={{ padding: "18px 18px 20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <CheckCircle2 size={17} style={{ color: "#b85430", marginTop: 2, flexShrink: 0 }} />
                  <p style={{ fontSize: 14, lineHeight: 1.75, color: "#171412", fontWeight: 600 }}>{item}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="use-cases" style={{ marginTop: 52 }}>
          <div className="eyebrow">Use cases</div>
          <div className="grid gap-4 lg:grid-cols-3" style={{ marginTop: 14 }}>
            {useCases.map(({ icon: Icon, title, body }) => (
              <article key={title} className="panel" style={{ padding: 24 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: "rgba(184,84,48,0.08)",
                    color: "#b85430",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={18} />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 650, letterSpacing: "-0.025em", marginTop: 14 }}>{title}</h2>
                <p style={{ fontSize: 14, lineHeight: 1.78, color: "#5e554d", marginTop: 10 }}>{body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="faq" className="panel" style={{ marginTop: 52, padding: "30px 28px" }}>
          <div className="eyebrow">Why Jumo Clip</div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]" style={{ marginTop: 12 }}>
            <div>
              <h2 className="editorial-title" style={{ fontSize: "clamp(1.8rem,3vw,3rem)" }}>
                A quieter interface for a very operational job.
              </h2>
            </div>
            <div style={{ display: "grid", gap: 18 }}>
              <div style={{ paddingBottom: 16, borderBottom: "1px solid #f0e7d8" }}>
                <div className="eyebrow" style={{ color: "#b85430" }}>Review</div>
                <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.8, color: "#5e554d" }}>
                  You can inspect clip choices instead of treating the generator as a black box.
                </p>
              </div>
              <div style={{ paddingBottom: 16, borderBottom: "1px solid #f0e7d8" }}>
                <div className="eyebrow" style={{ color: "#b85430" }}>Control</div>
                <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.8, color: "#5e554d" }}>
                  Subtitle edits, caption metadata, and regenerated outputs stay connected to the same job history.
                </p>
              </div>
              <div>
                <div className="eyebrow" style={{ color: "#b85430" }}>Continuity</div>
                <p style={{ marginTop: 8, fontSize: 14, lineHeight: 1.8, color: "#5e554d" }}>
                  The app is meant to carry footage from raw upload to final publishing steps without splitting the workflow apart.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="panel" style={{ marginTop: 52, padding: "30px 28px", marginBottom: 48 }}>
          <div className="eyebrow">Call to action</div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto]" style={{ alignItems: "center", marginTop: 12 }}>
            <div>
              <h2 className="editorial-title" style={{ fontSize: "clamp(1.8rem,3vw,3rem)" }}>
                Start with one recording and leave with reviewable vertical clips.
              </h2>
              <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.85, color: "#5e554d", maxWidth: 720 }}>
                Open the workspace to upload a video, choose the content mode, style subtitles, and move through the clipping flow in one place.
              </p>
            </div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link
                href="/upload"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "13px 18px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  background: "#171412",
                  color: "#f7f1e7",
                  textDecoration: "none",
                }}
              >
                Open workspace <ArrowRight size={15} />
              </Link>
              <Link
                href="/register"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "13px 18px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#171412",
                  textDecoration: "none",
                  border: "1px solid #d7cebf",
                  background: "#fbf7f1",
                }}
              >
                Create account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: "1px solid #d7cebf", background: "#f7f1e7" }}>
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "26px 24px 40px",
            display: "grid",
            gap: 22,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  background: "#171412",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Scissors size={14} color="#f7f1e7" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.03em" }}>Jumo Clip</div>
                <div className="eyebrow" style={{ fontSize: 10 }}>Paper-native video workflow</div>
              </div>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.75, color: "#5e554d", marginTop: 12, maxWidth: 320 }}>
              Upload, clip, refine subtitles, review outputs, and keep legal and publishing links visible in one calmer workspace.
            </p>
          </div>

          <div>
            <div className="eyebrow">Product</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              <Link href="/upload" style={{ color: "#171412", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Open workspace</Link>
              {/* <Link href="/guide" style={{ color: "#171412", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Guide</Link> */}
              <Link href="/history" style={{ color: "#171412", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>History</Link>
              <Link href="/scheduler" style={{ color: "#171412", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Scheduler</Link>
            </div>
          </div>

          <div>
            <div className="eyebrow">Access</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              <Link href="/login" style={{ color: "#171412", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Log in</Link>
              <Link href="/register" style={{ color: "#171412", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Create account</Link>
            </div>
          </div>

          <div>
            <div className="eyebrow">Legal</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              <Link href="/privacy" style={{ color: "#171412", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Privacy Policy</Link>
              <Link href="/tos" style={{ color: "#171412", textDecoration: "none", fontSize: 14, fontWeight: 600 }}>Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
