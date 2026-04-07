import Image from "~/components/ui/AppImage";
import type { RecommendedAssignment, Pokemon } from "@/lib/types";
import { pokemonSpriteSrc } from "@/lib/image";
import MatchupCellPill from "./MatchupCellPill";

interface MatchupAssignmentsProps {
  assignments: RecommendedAssignment[];
  myTeam: (Pokemon | null)[];
  opponentTeam: (Pokemon | null)[];
  totalScore: number;
  effectiveTotalScore: number;
  realism: {
    mode: "strict" | "sandbox";
    realismScore: number;
    penaltyTotal: number;
    violations: Array<{ message: string }>;
    warnings: Array<{ message: string }>;
  };
}

export default function MatchupAssignments({
  assignments,
  myTeam,
  opponentTeam,
  totalScore,
  effectiveTotalScore,
  realism,
}: MatchupAssignmentsProps) {
  if (assignments.length === 0) {
    return (
      <p className="text-sm py-4 text-center" style={{ color: "var(--text-muted)" }}>
        No assignments to display.
      </p>
    );
  }

  const totalLabel =
    effectiveTotalScore >= 35
      ? "Strong advantage"
      : effectiveTotalScore >= 15
      ? "Slight advantage"
      : effectiveTotalScore > -15
      ? "Roughly even"
      : effectiveTotalScore > -35
      ? "Slight disadvantage"
      : "Significant challenge";

  const totalColor =
    effectiveTotalScore >= 15
      ? "#4ade80"
      : effectiveTotalScore > -15
      ? "#94a3b8"
      : "#f87171";

  return (
    <div>
      {/* Summary bar */}
      <div
        className="mb-3 rounded-xl px-4 py-2.5 flex items-center justify-between"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <div>
          <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            Overall matchup
          </p>
          <p className="text-sm font-bold mt-0.5" style={{ color: totalColor }}>
            {totalLabel}
          </p>
        </div>
        <div
          className="text-xl font-black font-mono"
          style={{ color: totalColor }}
          aria-label={`Team score: ${effectiveTotalScore}`}
        >
          {effectiveTotalScore > 0 ? `+${effectiveTotalScore}` : effectiveTotalScore}
        </div>
      </div>

      <div
        className="mb-3 rounded-xl px-4 py-2 text-xs"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
      >
        Realism {realism.realismScore}/100 · {realism.mode === "sandbox" ? `penalty -${realism.penaltyTotal}` : "strict mode"}
        {realism.violations.length > 0 ? ` · ${realism.violations.length} violation(s)` : ""}
      </div>

      {/* Assignments list */}
      <div className="space-y-2">
        {assignments.map((assignment, i) => {
          const myPokemon = myTeam[assignment.mySlotIndex];
          const oppPokemon = opponentTeam[assignment.opponentSlotIndex];
          if (!myPokemon || !oppPokemon) return null;

          return (
            <div
              key={i}
              className="rounded-xl px-3 py-2.5 flex items-center gap-3"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
              role="article"
              aria-label={`Your slot ${assignment.mySlotIndex + 1} ${myPokemon.name} recommended against opponent slot ${assignment.opponentSlotIndex + 1} ${oppPokemon.name}: ${assignment.prediction}`}
            >
              {/* My Pokemon */}
              <div className="flex flex-col items-center gap-0.5 w-14 shrink-0">
                <Image
                  src={pokemonSpriteSrc(myPokemon.sprite, myPokemon.id)}
                  alt={myPokemon.name}
                  width={36}
                  height={36}
                  unoptimized
                  className="object-contain"
                />
                <span
                  className="text-[0.58rem] font-medium capitalize text-center truncate w-full"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {myPokemon.name}
                </span>
              </div>

              {/* Center: pill + vs */}
              <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <MatchupCellPill prediction={assignment.prediction} score={assignment.score} showLabel />
                <span className="text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
                  Slot {assignment.mySlotIndex + 1} → Slot {assignment.opponentSlotIndex + 1}
                </span>
              </div>

              {/* Opponent Pokemon */}
              <div className="flex flex-col items-center gap-0.5 w-14 shrink-0">
                <Image
                  src={pokemonSpriteSrc(oppPokemon.sprite, oppPokemon.id)}
                  alt={oppPokemon.name}
                  width={36}
                  height={36}
                  unoptimized
                  className="object-contain"
                />
                <span
                  className="text-[0.58rem] font-medium capitalize text-center truncate w-full"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {oppPokemon.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-[0.65rem] text-center" style={{ color: "var(--text-muted)" }}>
        Base score {totalScore > 0 ? `+${totalScore}` : totalScore}. Predictions use type matchups and base stats.
      </p>
    </div>
  );
}
