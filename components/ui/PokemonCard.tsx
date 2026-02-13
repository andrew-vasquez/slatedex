"use client";

import Image from "next/image";
import { useDraggable } from "@dnd-kit/core";
import { useEffect, useState } from "react";
import { TYPE_COLORS } from "@/lib/constants";
import type { Pokemon } from "@/lib/types";

interface PokemonCardProps {
  pokemon: Pokemon;
  isDraggable?: boolean;
  isCompact?: boolean;
  dragId?: string | null;
  onTap?: ((pokemon: Pokemon) => void) | null;
  canAddToTeam?: boolean;
}

const STAT_COLORS: Record<string, string> = {
  hp: "#136f3a",
  attack: "#b4232c",
  defense: "#1d5fa4",
};

const STAT_LABELS: Record<keyof typeof STAT_COLORS, string> = {
  hp: "HP",
  attack: "ATK",
  defense: "DEF",
};

const PokemonCard = ({
  pokemon,
  isDraggable: isDraggableProp = true,
  isCompact = false,
  dragId = null,
  onTap = null,
  canAddToTeam = false,
}: PokemonCardProps) => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const check = () => {
      setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 768);
    };

    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const uniqueId = dragId || `pokemon-${isDraggableProp ? "available" : "team"}-${pokemon.id}`;
  const shouldEnableDrag = isDraggableProp && !isTouchDevice;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: uniqueId,
    data: { pokemon },
    disabled: !shouldEnableDrag,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 1000 : ("auto" as const),
  };

  const handleTap = () => {
    if (onTap && canAddToTeam && !isDragging) onTap(pokemon);
  };

  const interactiveClass = [
    shouldEnableDrag && !isDragging ? "cursor-grab active:cursor-grabbing" : "",
    onTap && canAddToTeam ? "cursor-pointer" : "",
    isTouchDevice && onTap && canAddToTeam ? "active:scale-[0.98]" : "",
    isTouchDevice ? "select-none" : "",
  ].join(" ");

  if (isCompact) {
    return (
      <div
        ref={setNodeRef}
        style={{ ...style, transition: "transform 0.2s ease" }}
        {...(shouldEnableDrag ? listeners : {})}
        {...(shouldEnableDrag ? attributes : {})}
        onClick={handleTap}
        className={`relative flex h-full w-full flex-col items-center justify-center rounded-xl p-2 ${interactiveClass}`}
      >
        <span
          className="absolute right-1.5 top-1.5 rounded px-1 py-0.5 font-mono text-[0.55rem] font-medium"
          style={{ background: "rgba(69, 51, 34, 0.1)", color: "var(--text-muted)" }}
        >
          #{pokemon.id.toString().padStart(3, "0")}
        </span>

        <div className="relative mb-1 h-12 w-12 sm:h-14 sm:w-14">
          <Image
            src={pokemon.sprite}
            alt={pokemon.name}
            width={56}
            height={56}
            className="h-full w-full object-contain drop-shadow-md"
          />
        </div>

        <h3 className="text-center text-[0.65rem] font-semibold leading-tight sm:text-xs" style={{ color: "var(--text-primary)" }}>
          {pokemon.name}
        </h3>

        <div className="mt-1 flex flex-wrap justify-center gap-0.5">
          {pokemon.types.map((type: string) => (
            <span key={type} className={`rounded px-1.5 py-0 text-[0.5rem] font-semibold text-white ${TYPE_COLORS[type]}`}>
              {type.slice(0, 3).toUpperCase()}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease" }}
      {...(shouldEnableDrag ? listeners : {})}
      {...(shouldEnableDrag ? attributes : {})}
      onClick={handleTap}
      className={`group relative overflow-hidden rounded-xl border ${interactiveClass} ${isDragging ? "rotate-1" : ""}`}
      aria-label={`${pokemon.name} card`}
    >
      <div
        className="flex items-center gap-3 p-3"
        style={{
          background: "var(--surface-2)",
          borderColor: "var(--border)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
        >
          <Image
            src={pokemon.sprite}
            alt={pokemon.name}
            width={48}
            height={48}
            className="h-11 w-11 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {pokemon.name}
            </h3>
            <span className="shrink-0 font-mono text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
              #{pokemon.id.toString().padStart(3, "0")}
            </span>
          </div>

          <div className="mb-2 flex gap-1">
            {pokemon.types.map((type: string) => (
              <span key={type} className={`rounded px-2 py-0.5 text-[0.6rem] font-semibold text-white ${TYPE_COLORS[type]}`}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            {(["hp", "attack", "defense"] as const).map((stat) => {
              const value = pokemon[stat];
              const pct = Math.min((value / 160) * 100, 100);

              return (
                <div key={stat} className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-baseline justify-between">
                    <span className="text-[0.5rem] font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
                      {STAT_LABELS[stat]}
                    </span>
                    <span className="font-mono text-[0.55rem] font-semibold tabular-nums" style={{ color: STAT_COLORS[stat] }}>
                      {value}
                    </span>
                  </div>
                  <div className="stat-bar">
                    <div className="stat-bar-fill" style={{ width: `${pct}%`, background: STAT_COLORS[stat] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {onTap && canAddToTeam && (
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110"
            style={{ background: "rgba(19, 111, 58, 0.12)", color: "#136f3a", border: "1px solid rgba(19, 111, 58, 0.25)" }}
            aria-hidden="true"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 2.5v7M2.5 6h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default PokemonCard;
