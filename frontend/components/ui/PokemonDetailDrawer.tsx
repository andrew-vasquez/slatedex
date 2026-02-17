"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { FiPlus, FiX } from "react-icons/fi";
import { TYPE_COLORS } from "@/lib/constants";
import type { Pokemon } from "@/lib/types";

interface PokemonDetailDrawerProps {
  pokemon: Pokemon | null;
  onClose: () => void;
  onAdd: (pokemon: Pokemon) => void;
  canAdd: boolean;
}

const STAT_CONFIG = [
  { key: "hp" as const, label: "HP", color: "#136f3a" },
  { key: "attack" as const, label: "ATK", color: "#b4232c" },
  { key: "defense" as const, label: "DEF", color: "#1d5fa4" },
];

const PokemonDetailDrawer = ({ pokemon, onClose, onAdd, canAdd }: PokemonDetailDrawerProps) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (pokemon) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [pokemon]);

  if (!pokemon) return null;

  const totalStats = pokemon.hp + pokemon.attack + pokemon.defense;

  return (
    <dialog
      ref={dialogRef}
      className="pokemon-detail-dialog"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="pokemon-detail-content panel">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
          aria-label="Close detail view"
        >
          <FiX size={16} />
        </button>

        {/* Header: sprite + name */}
        <div className="flex items-center gap-4 mb-4">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
          >
            <Image
              src={pokemon.sprite}
              alt={pokemon.name}
              width={72}
              height={72}
              className="h-16 w-16 object-contain drop-shadow-md"
            />
          </div>
          <div className="min-w-0">
            <p className="font-mono text-[0.62rem]" style={{ color: "var(--text-muted)" }}>
              #{pokemon.id.toString().padStart(3, "0")}
            </p>
            <h3 className="font-display text-xl" style={{ color: "var(--text-primary)" }}>
              {pokemon.name}
            </h3>
            <div className="mt-1 flex gap-1.5">
              {pokemon.types.map((type) => (
                <span key={type} className={`rounded-md px-2.5 py-0.5 text-[0.65rem] font-semibold text-white ${TYPE_COLORS[type]}`}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-4">
          <p className="text-[0.6rem] font-semibold uppercase tracking-[0.16em] mb-2" style={{ color: "var(--text-muted)" }}>
            Base Stats
          </p>
          <div className="flex flex-col gap-2">
            {STAT_CONFIG.map(({ key, label, color }) => {
              const value = pokemon[key];
              const pct = Math.min((value / 160) * 100, 100);
              return (
                <div key={key} className="flex items-center gap-2.5">
                  <span className="w-8 text-[0.62rem] font-semibold uppercase text-right" style={{ color: "var(--text-muted)" }}>
                    {label}
                  </span>
                  <span className="w-8 text-right font-mono text-xs font-semibold tabular-nums" style={{ color }}>
                    {value}
                  </span>
                  <div className="flex-1 stat-bar !h-2">
                    <div className="stat-bar-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[0.62rem] font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
              Total (HP+ATK+DEF)
            </span>
            <span className="font-mono text-xs font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {totalStats}
            </span>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 rounded-lg px-3 py-2" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <p className="text-[0.55rem] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
              Generation
            </p>
            <p className="font-display text-sm" style={{ color: "var(--text-primary)" }}>
              {pokemon.generation}
            </p>
          </div>
          <div className="flex-1 rounded-lg px-3 py-2" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <p className="text-[0.55rem] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>
              Evolution
            </p>
            <p className="font-display text-sm" style={{ color: "var(--text-primary)" }}>
              {pokemon.isFinalEvolution ? "Final" : "Not final"}
            </p>
          </div>
        </div>

        {/* Add button */}
        <button
          type="button"
          onClick={() => {
            onAdd(pokemon);
            onClose();
          }}
          disabled={!canAdd}
          className="auth-submit w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiPlus size={16} />
          {canAdd ? "Add to Team" : "Team is Full"}
        </button>
      </div>
    </dialog>
  );
};

export default PokemonDetailDrawer;
