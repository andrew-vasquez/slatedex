"use client";

import Image from "next/image";
import { useDraggable } from "@dnd-kit/core";
import { useState, useEffect } from "react";
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
  hp: "#4ade80",
  attack: "#f87171",
  defense: "#60a5fa",
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
      setIsTouchDevice(
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth <= 768
      );
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
    isTouchDevice && onTap && canAddToTeam ? "active:scale-[0.97]" : "",
    isTouchDevice ? "select-none" : "",
  ].join(" ");

  // Compact card for team slots
  if (isCompact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...(shouldEnableDrag ? listeners : {})}
        {...(shouldEnableDrag ? attributes : {})}
        onClick={handleTap}
        className={`
          relative w-full h-full rounded-xl flex flex-col items-center justify-center
          p-2 group transition-all duration-200 ${interactiveClass}
        `}
        {...(isTouchDevice && isDraggableProp ? { onTouchStart: (e: React.TouchEvent) => e.preventDefault() } : {})}
      >
        {/* Dex number */}
        <span
          className="absolute top-1.5 right-1.5 text-[0.55rem] font-mono font-medium px-1.5 py-0.5 rounded"
          style={{ background: "var(--surface-0)", color: "var(--text-muted)", opacity: 0.7 }}
        >
          #{pokemon.id.toString().padStart(3, "0")}
        </span>

        <div className="relative w-12 h-12 sm:w-14 sm:h-14 mb-1">
          <Image
            src={pokemon.sprite}
            alt={pokemon.name}
            width={56}
            height={56}
            className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
          />
        </div>
        <h3 className="font-semibold text-[0.65rem] sm:text-xs text-center leading-tight mb-1" style={{ color: "var(--text-primary)" }}>
          {pokemon.name}
        </h3>
        <div className="flex gap-0.5 flex-wrap justify-center">
          {pokemon.types.map((type: string) => (
            <span
              key={type}
              className={`px-1.5 py-0 rounded text-[0.5rem] font-semibold text-white ${TYPE_COLORS[type]}`}
            >
              {type.slice(0, 3).toUpperCase()}
            </span>
          ))}
        </div>
      </div>
    );
  }

  // Full card — horizontal layout with stat bars
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(shouldEnableDrag ? listeners : {})}
      {...(shouldEnableDrag ? attributes : {})}
      onClick={handleTap}
      className={`
        group relative rounded-xl overflow-hidden transition-all duration-200
        hover:shadow-lg hover:border-[var(--border-hover)]
        ${isDragging ? "rotate-1 shadow-xl" : ""}
        ${interactiveClass}
      `}
      {...(isTouchDevice && isDraggableProp ? { onTouchStart: (e: React.TouchEvent) => e.preventDefault() } : {})}
    >
      <div
        className="flex items-center gap-3 p-3"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "12px" }}
      >
        {/* Sprite */}
        <div
          className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
          style={{ background: "var(--surface-3)" }}
        >
          <Image
            src={pokemon.sprite}
            alt={pokemon.name}
            width={48}
            height={48}
            className="w-11 h-11 object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h3 className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
              {pokemon.name}
            </h3>
            <span className="text-[0.6rem] font-mono shrink-0" style={{ color: "var(--text-muted)" }}>
              #{pokemon.id.toString().padStart(3, "0")}
            </span>
          </div>

          {/* Type pills */}
          <div className="flex gap-1 mb-2">
            {pokemon.types.map((type: string) => (
              <span
                key={type}
                className={`px-2 py-0.5 rounded text-[0.6rem] font-semibold text-white ${TYPE_COLORS[type]}`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            ))}
          </div>

          {/* Stat bars */}
          <div className="flex gap-2">
            {(["hp", "attack", "defense"] as const).map((stat) => {
              const value = pokemon[stat];
              const pct = Math.min((value / 160) * 100, 100);
              return (
                <div key={stat} className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-0.5">
                    <span className="text-[0.5rem] font-medium uppercase" style={{ color: "var(--text-muted)" }}>
                      {stat === "hp" ? "HP" : stat === "attack" ? "ATK" : "DEF"}
                    </span>
                    <span className="text-[0.55rem] font-mono font-semibold tabular-nums" style={{ color: STAT_COLORS[stat] }}>
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

        {/* Add indicator */}
        {onTap && canAddToTeam && (
          <div
            className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center
                       transition-all duration-200 group-hover:scale-110"
            style={{
              background: "rgba(74, 222, 128, 0.12)",
              color: "#4ade80",
              border: "1px solid rgba(74, 222, 128, 0.2)",
            }}
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
