"use client";

import { useState } from "react";
import Image from "~/components/ui/AppImage";
import type { MatchupMatrixCell, Pokemon } from "@/lib/types";
import { pokemonSpriteSrc } from "@/lib/image";
import MatchupCellPill from "./MatchupCellPill";

interface MatchupMatrixProps {
  matrix: MatchupMatrixCell[];
  myTeam: (Pokemon | null)[];
  opponentTeam: (Pokemon | null)[];
  realism: {
    realismScore: number;
    penaltyTotal: number;
    mode: "strict" | "sandbox";
    violations: Array<{ message: string }>;
  };
}

export default function MatchupMatrix({
  matrix,
  myTeam,
  opponentTeam,
  realism,
}: MatchupMatrixProps) {
  const [focusedCell, setFocusedCell] = useState<MatchupMatrixCell | null>(null);

  const myFilledSlots = myTeam
    .map((p, i) => ({ pokemon: p, index: i }))
    .filter((s) => s.pokemon !== null) as { pokemon: Pokemon; index: number }[];

  const oppFilledSlots = opponentTeam
    .map((p, i) => ({ pokemon: p, index: i }))
    .filter((s) => s.pokemon !== null) as { pokemon: Pokemon; index: number }[];

  const cellMap = new Map<string, MatchupMatrixCell>();
  for (const cell of matrix) {
    cellMap.set(`${cell.mySlotIndex},${cell.opponentSlotIndex}`, cell);
  }

  return (
    <div>
      {/* Detail drawer for tapped cell */}
      {focusedCell && (
        <div
          className="mb-3 rounded-xl p-3"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              {myTeam[focusedCell.mySlotIndex] && (
                <Image
                  src={pokemonSpriteSrc(myTeam[focusedCell.mySlotIndex]!.sprite, myTeam[focusedCell.mySlotIndex]!.id)}
                  alt={myTeam[focusedCell.mySlotIndex]!.name}
                  width={28}
                  height={28}
                  unoptimized
                  className="object-contain"
                />
              )}
              <span className="text-xs font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
                {myTeam[focusedCell.mySlotIndex]?.name}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>vs</span>
              {opponentTeam[focusedCell.opponentSlotIndex] && (
                <Image
                  src={pokemonSpriteSrc(opponentTeam[focusedCell.opponentSlotIndex]!.sprite, opponentTeam[focusedCell.opponentSlotIndex]!.id)}
                  alt={opponentTeam[focusedCell.opponentSlotIndex]!.name}
                  width={28}
                  height={28}
                  unoptimized
                  className="object-contain"
                />
              )}
              <span className="text-xs font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
                {opponentTeam[focusedCell.opponentSlotIndex]?.name}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setFocusedCell(null)}
              className="text-[0.7rem]"
              style={{ color: "var(--text-muted)" }}
              aria-label="Close detail"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <MatchupCellPill prediction={focusedCell.prediction} score={focusedCell.score} showLabel />
          </div>
          {focusedCell.reasons.length > 0 && (
            <ul className="space-y-0.5">
              {focusedCell.reasons.map((reason, i) => (
                <li key={i} className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--text-muted)" }}>·</span>
                  {reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Scrollable matrix */}
      <div
        className="overflow-x-auto rounded-xl"
        style={{ border: "1px solid var(--border)" }}
        role="grid"
        aria-label="Matchup matrix"
      >
        <table className="w-full border-collapse" style={{ minWidth: `${oppFilledSlots.length * 64 + 80}px` }}>
          <thead>
            <tr>
              {/* Top-left corner */}
              <th
                className="sticky left-0 z-10 p-2 text-[0.62rem] font-semibold text-left"
                style={{ background: "var(--surface-2)", color: "var(--text-muted)", borderBottom: "1px solid var(--border)" }}
              >
                <span className="block" style={{ color: "var(--text-muted)" }}>Your</span>
                <span className="block" style={{ color: "var(--text-muted)" }}>↓ / Opp →</span>
              </th>
              {oppFilledSlots.map(({ pokemon, index }) => (
                <th
                  key={index}
                  className="p-2 text-center"
                  style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)", borderLeft: "1px solid var(--border)", minWidth: "60px" }}
                >
                  <div className="flex flex-col items-center gap-0.5">
                    <Image
                      src={pokemonSpriteSrc(pokemon.sprite, pokemon.id)}
                      alt={pokemon.name}
                      width={28}
                      height={28}
                      unoptimized
                      className="object-contain mx-auto"
                    />
                    <span
                      className="text-[0.55rem] font-medium capitalize truncate max-w-[56px]"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {pokemon.name}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {myFilledSlots.map(({ pokemon, index: myIndex }) => (
              <tr key={myIndex}>
                <td
                  className="sticky left-0 z-10 p-2"
                  style={{
                    background: "var(--surface-2)",
                    borderTop: "1px solid var(--border)",
                    minWidth: "72px",
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <Image
                      src={pokemonSpriteSrc(pokemon.sprite, pokemon.id)}
                      alt={pokemon.name}
                      width={24}
                      height={24}
                      unoptimized
                      className="object-contain shrink-0"
                    />
                    <span
                      className="text-[0.58rem] font-medium capitalize truncate"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {pokemon.name}
                    </span>
                  </div>
                </td>
                {oppFilledSlots.map(({ index: oppIndex }) => {
                  const cell = cellMap.get(`${myIndex},${oppIndex}`);
                  return (
                    <td
                      key={oppIndex}
                      className="p-1.5 text-center"
                      style={{
                        borderTop: "1px solid var(--border)",
                        borderLeft: "1px solid var(--border)",
                        background: focusedCell?.mySlotIndex === myIndex && focusedCell?.opponentSlotIndex === oppIndex
                          ? "var(--version-color-soft, var(--accent-soft))"
                          : "var(--surface-1)",
                      }}
                    >
                      {cell ? (
                        <button
                          type="button"
                          onClick={() => setFocusedCell(focusedCell?.mySlotIndex === myIndex && focusedCell?.opponentSlotIndex === oppIndex ? null : cell)}
                          className="flex items-center justify-center w-full"
                          aria-label={`${pokemon.name} vs ${opponentTeam[oppIndex]?.name ?? "?"}: ${cell.prediction}, score ${cell.score}`}
                        >
                          <MatchupCellPill prediction={cell.prediction} score={cell.score} size="sm" />
                        </button>
                      ) : (
                        <span className="text-[0.6rem]" style={{ color: "var(--border)" }}>—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-[0.65rem] text-center" style={{ color: "var(--text-muted)" }}>
        Tap any cell for matchup details · Realism {realism.realismScore}/100
        {realism.mode === "sandbox" ? ` (penalty -${realism.penaltyTotal})` : ""}
      </p>
    </div>
  );
}
