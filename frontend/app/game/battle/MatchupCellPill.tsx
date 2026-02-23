"use client";

import type { MatchupPrediction } from "@/lib/types";

interface MatchupCellPillProps {
  prediction: MatchupPrediction;
  score?: number;
  size?: "sm" | "md";
  showLabel?: boolean;
}

const PREDICTION_CONFIG: Record<
  MatchupPrediction,
  { label: string; abbr: string; bg: string; text: string; border: string }
> = {
  win:       { label: "Win",       abbr: "W",  bg: "rgba(34,197,94,0.18)",  text: "#4ade80", border: "rgba(74,222,128,0.35)" },
  "lean-win":{ label: "Lean Win",  abbr: "W~", bg: "rgba(132,204,22,0.15)", text: "#a3e635", border: "rgba(163,230,53,0.3)"  },
  even:      { label: "Even",      abbr: "~",  bg: "rgba(148,163,184,0.12)",text: "#94a3b8", border: "rgba(148,163,184,0.25)"},
  "lean-loss":{ label: "Lean Loss",abbr: "L~", bg: "rgba(251,146,60,0.15)", text: "#fb923c", border: "rgba(251,146,60,0.3)"  },
  loss:      { label: "Loss",      abbr: "L",  bg: "rgba(239,68,68,0.18)",  text: "#f87171", border: "rgba(248,113,113,0.35)"},
};

export default function MatchupCellPill({
  prediction,
  score,
  size = "md",
  showLabel = false,
}: MatchupCellPillProps) {
  const cfg = PREDICTION_CONFIG[prediction];

  const isSmall = size === "sm";
  const padding = isSmall ? "px-1.5 py-0.5" : "px-2 py-1";
  const textSize = isSmall ? "text-[0.65rem]" : "text-[0.72rem]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-semibold font-mono ${padding} ${textSize}`}
      style={{
        background: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`,
      }}
      aria-label={`${cfg.label}${score !== undefined ? `, score ${score}` : ""}`}
    >
      {showLabel ? cfg.label : cfg.abbr}
      {score !== undefined && !showLabel && (
        <span className="opacity-70 text-[0.6rem]">
          {score > 0 ? `+${score}` : score}
        </span>
      )}
    </span>
  );
}
