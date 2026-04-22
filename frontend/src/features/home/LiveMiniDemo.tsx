import { useEffect, useMemo, useState } from "react";
import { FiMessageCircle, FiZap } from "react-icons/fi";

type DemoMode = "threats" | "swaps" | "analyze";

const DEMO_TEAM = [
  { name: "Gyarados", tags: ["Water", "Flying"] },
  { name: "Breloom", tags: ["Grass", "Fighting"] },
  { name: "Magnezone", tags: ["Electric", "Steel"] },
  { name: "Garchomp", tags: ["Dragon", "Ground"] },
  { name: "Rotom-Wash", tags: ["Electric", "Water"] },
  { name: "Talonflame", tags: ["Fire", "Flying"] },
];

const DEMO_RESPONSES: Record<DemoMode, string> = {
  threats:
    "Primary pressure: Ice coverage and strong Rock priority. Keep Magnezone healthy, then pivot Rotom-Wash into Talonflame to keep momentum.",
  swaps:
    "Two legal swaps: 1) Replace Dragonite with Talonflame for better Ice tolerance. 2) Replace Breloom with Scizor to improve defensive pivots.",
  analyze:
    "Team grade: A-. Speed curve is strong, hazard posture is stable, and defensive overlap is low. Biggest fix: add one cleaner answer to special Ice attackers.",
};

export default function LiveMiniDemo() {
  const [mode, setMode] = useState<DemoMode>("analyze");
  const [visibleChars, setVisibleChars] = useState(0);
  const activeResponse = DEMO_RESPONSES[mode];

  useEffect(() => {
    setVisibleChars(0);
  }, [mode]);

  useEffect(() => {
    if (visibleChars >= activeResponse.length) return;
    const timer = window.setTimeout(() => {
      setVisibleChars((current) => Math.min(activeResponse.length, current + 3));
    }, 24);
    return () => window.clearTimeout(timer);
  }, [activeResponse, visibleChars]);

  const displayedResponse = useMemo(
    () => activeResponse.slice(0, visibleChars),
    [activeResponse, visibleChars]
  );

  return (
    <aside className="landing-reveal landing-hero-aside panel p-4 sm:p-5" style={{ animationDelay: "210ms" }}>
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.22em]" style={{ color: "var(--text-muted)" }}>
        Live Mini Demo
      </p>
      <div className="mt-3 rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
        <div className="grid grid-cols-2 gap-1.5">
          {DEMO_TEAM.slice(0, 4).map((slot) => (
            <div
              key={slot.name}
              className="rounded-lg border px-2 py-1.5"
              style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}
            >
              <p className="truncate text-[0.7rem] font-semibold" style={{ color: "var(--text-primary)" }}>
                {slot.name}
              </p>
              <p className="text-[0.62rem]" style={{ color: "var(--text-muted)" }}>
                {slot.tags.join(" / ")}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <span className="rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
            Risks: 2
          </span>
          <span className="rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
            Stable: 12
          </span>
          <span className="rounded-full border px-2 py-0.5 text-[0.62rem] font-semibold" style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}>
            Fast mons: 3
          </span>
        </div>
      </div>

      <div className="mt-3 rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
        <p className="mb-2 flex items-center gap-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--text-muted)" }}>
          <FiMessageCircle size={11} />
          AI Coach
        </p>
        <p className="text-[0.72rem] leading-relaxed" style={{ color: "var(--text-secondary)", minHeight: "4.1rem" }}>
          {displayedResponse}
          {visibleChars < activeResponse.length ? "▌" : ""}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => setMode("threats")}
            className="rounded-lg border px-2 py-1 text-[0.62rem] font-semibold"
            style={{
              borderColor: mode === "threats" ? "var(--version-color-border, rgba(218,44,67,0.3))" : "var(--border)",
              background: mode === "threats" ? "var(--version-color-soft, rgba(218,44,67,0.12))" : "var(--surface-1)",
              color: "var(--text-secondary)",
            }}
          >
            Threats
          </button>
          <button
            type="button"
            onClick={() => setMode("swaps")}
            className="rounded-lg border px-2 py-1 text-[0.62rem] font-semibold"
            style={{
              borderColor: mode === "swaps" ? "var(--version-color-border, rgba(218,44,67,0.3))" : "var(--border)",
              background: mode === "swaps" ? "var(--version-color-soft, rgba(218,44,67,0.12))" : "var(--surface-1)",
              color: "var(--text-secondary)",
            }}
          >
            Swaps
          </button>
          <button
            type="button"
            onClick={() => setMode("analyze")}
            className="inline-flex items-center justify-center gap-1 rounded-lg border px-2 py-1 text-[0.62rem] font-semibold"
            style={{
              borderColor: mode === "analyze" ? "var(--version-color-border, rgba(218,44,67,0.3))" : "var(--border)",
              background: mode === "analyze" ? "var(--version-color-soft, rgba(218,44,67,0.12))" : "var(--surface-1)",
              color: "var(--text-secondary)",
            }}
          >
            <FiZap size={10} />
            Analyze
          </button>
        </div>
      </div>
    </aside>
  );
}
