"use client";

import Image from "next/image";
import { useDraggable } from "@dnd-kit/core";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiInfo } from "react-icons/fi";
import { TYPE_COLORS } from "@/lib/constants";
import { pokemonSpriteSrc } from "@/lib/image";
import type { Pokemon } from "@/lib/types";

interface PokemonCardProps {
  pokemon: Pokemon;
  isDraggable?: boolean;
  isCompact?: boolean;
  isTeamSlot?: boolean;
  isAboveFold?: boolean;
  dragId?: string | null;
  onTap?: ((pokemon: Pokemon) => void) | null;
  canAddToTeam?: boolean;
  versionLabelMap?: Record<string, string>;
  dragEnabled?: boolean;
  onInspect?: ((pokemon: Pokemon) => void) | null;
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

const ALL_STATS = [
  { key: "hp", label: "HP", color: "#136f3a" },
  { key: "attack", label: "ATK", color: "#b4232c" },
  { key: "defense", label: "DEF", color: "#1d5fa4" },
  { key: "specialAttack", label: "SPA", color: "#7c3aed" },
  { key: "specialDefense", label: "SPD", color: "#d97706" },
  { key: "speed", label: "SPE", color: "#0891b2" },
] as const;

const PokemonCard = ({
  pokemon,
  isDraggable: isDraggableProp = true,
  isCompact = false,
  isTeamSlot = false,
  isAboveFold = false,
  dragId = null,
  onTap = null,
  canAddToTeam = false,
  versionLabelMap = {},
  dragEnabled = true,
  onInspect = null,
}: PokemonCardProps) => {
  const uniqueId = dragId || `pokemon-${isDraggableProp ? "available" : "team"}-${pokemon.id}`;
  const shouldEnableDrag = isDraggableProp && dragEnabled;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: uniqueId,
    data: { pokemon },
    disabled: !shouldEnableDrag,
  });

  // Quick-peek popover state
  const [showPeek, setShowPeek] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardElRef = useRef<HTMLDivElement | null>(null);
  const [peekRect, setPeekRect] = useState<{ top: number; left: number; width: number } | null>(null);

  const openPeek = useCallback(() => {
    if (cardElRef.current) {
      const r = cardElRef.current.getBoundingClientRect();
      setPeekRect({ top: r.top, left: r.left + r.width / 2, width: r.width });
    }
    setShowPeek(true);
  }, []);
  const closePeek = useCallback(() => {
    setShowPeek(false);
    setPeekRect(null);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (isTeamSlot) return;
    hoverTimerRef.current = setTimeout(openPeek, 400);
  }, [isTeamSlot, openPeek]);

  const handleMouseLeave = useCallback(() => {
    closePeek();
  }, [closePeek]);

  const handleTouchStart = useCallback(() => {
    if (isTeamSlot || shouldEnableDrag) return;
    longPressTimerRef.current = setTimeout(openPeek, 500);
  }, [isTeamSlot, shouldEnableDrag, openPeek]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  }, []);

  // Clean up timers
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  const bst = pokemon.hp + pokemon.attack + pokemon.defense + pokemon.specialAttack + pokemon.specialDefense + pokemon.speed;

  const peekPopover = showPeek && !isDragging && peekRect && typeof document !== "undefined" && createPortal(
    <div
      className="pokemon-peek-popover"
      style={{ top: peekRect.top - 8, left: peekRect.left }}
      onMouseEnter={() => setShowPeek(true)}
      onMouseLeave={closePeek}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="font-semibold text-[0.78rem]" style={{ color: "var(--text-primary)" }}>{pokemon.name}</span>
        <span className="font-mono text-[0.6rem]" style={{ color: "var(--text-muted)" }}>#{pokemon.id.toString().padStart(3, "0")}</span>
        <span className="ml-auto font-mono text-[0.58rem] font-bold" style={{ color: "var(--text-secondary)" }}>BST {bst}</span>
      </div>
      <div className="grid grid-cols-3 gap-x-3 gap-y-1">
        {ALL_STATS.map((s) => {
          const val = pokemon[s.key];
          const pct = Math.min((val / 160) * 100, 100);
          return (
            <div key={s.key} className="flex items-center gap-1.5">
              <span className="w-[22px] text-[0.55rem] font-bold uppercase" style={{ color: s.color }}>{s.label}</span>
              <div className="flex-1 h-[4px] rounded-full" style={{ background: "var(--surface-1)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: s.color }} />
              </div>
              <span className="w-[20px] text-right font-mono text-[0.58rem] font-semibold tabular-nums" style={{ color: "var(--text-secondary)" }}>{val}</span>
            </div>
          );
        })}
      </div>
      {(pokemon.isLegendary || pokemon.isMythical || pokemon.isStarterLine) && (
        <div className="flex gap-1 mt-1.5">
          {pokemon.isLegendary && <span className="peek-tag" style={{ background: "rgba(234,179,8,0.15)", color: "#fbbf24" }}>Legendary</span>}
          {pokemon.isMythical && <span className="peek-tag" style={{ background: "rgba(168,85,247,0.15)", color: "#a855f7" }}>Mythical</span>}
          {pokemon.isStarterLine && <span className="peek-tag" style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}>Starter</span>}
        </div>
      )}
    </div>,
    document.body
  );

  // Merge refs: dnd-kit setNodeRef + cardElRef for peek positioning
  const mergedRef = useCallback((node: HTMLDivElement | null) => {
    setNodeRef(node);
    cardElRef.current = node;
  }, [setNodeRef]);

  const peekHandlers = isTeamSlot ? {} : {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };

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
    onTap && canAddToTeam ? "active:scale-[0.98] select-none" : "",
  ].join(" ");

  const exclusiveVersionLabels: string[] =
    pokemon.exclusiveStatus === "exclusive" && pokemon.exclusiveToVersionIds
      ? pokemon.exclusiveToVersionIds.map((versionId) => versionLabelMap[versionId] ?? versionId)
      : [];
  const isVersionExclusive = exclusiveVersionLabels.length > 0;
  const exclusivityText = isVersionExclusive
    ? `Exclusive to: ${exclusiveVersionLabels.join(", ")}`
    : "";

  if (isTeamSlot) {
    return (
      <div
        ref={setNodeRef}
        suppressHydrationWarning
        style={{ ...style, transition: "transform 0.2s ease" }}
        {...(shouldEnableDrag ? listeners : {})}
        {...(shouldEnableDrag ? attributes : {})}
        onClick={handleTap}
        className={`relative flex h-full w-full flex-col items-center justify-center rounded-xl px-2 py-2.5 ${interactiveClass}`}
      >
        <div className="relative mb-1 h-12 w-12 sm:h-14 sm:w-14">
          <Image
            src={pokemonSpriteSrc(pokemon.sprite, pokemon.id)}
            alt={pokemon.name}
            width={56}
            height={56}
            sizes="(min-width: 640px) 56px, 48px"
            loading="eager"
            unoptimized
            className="h-full w-full object-contain drop-shadow-md"
          />
        </div>
        <h3 className="text-center text-[0.76rem] font-semibold leading-tight sm:text-sm" style={{ color: "var(--text-primary)" }}>
          {pokemon.name}
        </h3>
        <p className="mt-0.5 font-mono text-[0.6rem] leading-none" style={{ color: "var(--text-muted)" }}>
          #{pokemon.id.toString().padStart(3, "0")}
        </p>
        <div className="mt-1 flex flex-wrap justify-center gap-1">
          {pokemon.types.map((type: string) => (
            <span key={type} className={`rounded-md px-1.5 py-px text-[0.6rem] font-semibold text-white ${TYPE_COLORS[type]}`}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (isCompact) {
    return (
      <>
      <div
        ref={mergedRef}
        suppressHydrationWarning
        data-dragging={isDragging ? "true" : undefined}
        style={{ ...style, background: "var(--surface-2)", border: "1px solid var(--border)" }}
        {...(shouldEnableDrag ? listeners : {})}
        {...(shouldEnableDrag ? attributes : {})}
        onClick={handleTap}
        {...peekHandlers}
        className={`group pokemon-card-lift relative flex items-center gap-2.5 overflow-hidden rounded-lg border px-2 py-1.5 ${interactiveClass} ${isDragging ? "rotate-1" : ""}`}
        aria-label={`${pokemon.name} card`}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
        >
          <Image
            src={pokemonSpriteSrc(pokemon.sprite, pokemon.id)}
            alt={pokemon.name}
            width={32}
            height={32}
            sizes="28px"
            loading={isAboveFold ? "eager" : "lazy"}
            unoptimized
            className="h-7 w-7 object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-110"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[0.74rem] font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
              {pokemon.name}
            </h3>
            <span className="shrink-0 font-mono text-[0.58rem] leading-none" style={{ color: "var(--text-muted)" }}>
              #{pokemon.id.toString().padStart(3, "0")}
            </span>
          </div>

          <div className="mt-0.5 flex gap-0.5">
            {pokemon.types.map((type: string) => (
              <span key={type} className={`rounded px-1 py-px text-[0.54rem] font-semibold leading-tight text-white ${TYPE_COLORS[type]}`}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            ))}
            {isVersionExclusive && (
              <span
                className="rounded px-1 py-px text-[0.5rem] font-bold uppercase tracking-wide"
                style={{ background: "rgba(234,179,8,0.16)", color: "#fde047" }}
                title={exclusivityText}
              >
                EX
              </span>
            )}
          </div>
        </div>

        {onInspect && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onInspect(pokemon); }}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full opacity-0 transition-opacity duration-150 group-hover:opacity-100"
            style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.25)" }}
            aria-label={`View details for ${pokemon.name}`}
          >
            <FiInfo size={9} />
          </button>
        )}
      </div>
      {peekPopover}
      </>
    );
  }

  return (
    <>
    <div
      ref={mergedRef}
      suppressHydrationWarning
      data-dragging={isDragging ? "true" : undefined}
      style={{ ...style }}
      {...(shouldEnableDrag ? listeners : {})}
      {...(shouldEnableDrag ? attributes : {})}
      onClick={handleTap}
      {...peekHandlers}
      className={`group pokemon-card-lift relative overflow-hidden rounded-xl border ${interactiveClass} ${isDragging ? "rotate-1" : ""}`}
      aria-label={`${pokemon.name} card`}
    >
      <div
        className="flex items-center gap-3 p-3"
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "var(--surface-1)", border: "1px solid var(--border)" }}
        >
          <Image
            src={pokemonSpriteSrc(pokemon.sprite, pokemon.id)}
            alt={pokemon.name}
            width={48}
            height={48}
            sizes="44px"
            loading={isAboveFold ? "eager" : "lazy"}
            unoptimized
            className="h-11 w-11 object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110"
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {pokemon.name}
            </h3>
            <span className="shrink-0 font-mono text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
              #{pokemon.id.toString().padStart(3, "0")}
            </span>
            {isVersionExclusive && (
              <span
                className="shrink-0 rounded px-1.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.06em]"
                style={{
                  background: "rgba(234, 179, 8, 0.16)",
                  border: "1px solid rgba(234, 179, 8, 0.34)",
                  color: "#fef08a",
                }}
                title={exclusivityText}
                aria-label={exclusivityText}
              >
                Exclusive
              </span>
            )}
          </div>

          <div className="mb-2 flex gap-1">
            {pokemon.types.map((type: string) => (
              <span key={type} className={`type-badge rounded px-2 py-0.5 text-[0.68rem] font-semibold text-white ${TYPE_COLORS[type]}`}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            {(["hp", "attack", "defense"] as const).map((stat, si) => {
              const value = pokemon[stat];
              const pct = Math.min((value / 160) * 100, 100);

              return (
                <div key={stat} className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-baseline justify-between">
                    <span className="text-[0.6rem] font-semibold uppercase" style={{ color: "var(--text-muted)" }}>
                      {STAT_LABELS[stat]}
                    </span>
                    <span className="font-mono text-[0.65rem] font-semibold tabular-nums" style={{ color: STAT_COLORS[stat] }}>
                      {value}
                    </span>
                  </div>
                  <div className="stat-bar">
                    <div
                      className="stat-bar-fill stat-bar-fill--animated"
                      style={{
                        width: `${pct}%`,
                        background: STAT_COLORS[stat],
                        "--stat-delay": `${si * 60}ms`,
                      } as React.CSSProperties}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-1.5">
          {onInspect && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onInspect(pokemon); }}
              className="flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110"
              style={{ background: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", border: "1px solid rgba(59, 130, 246, 0.25)" }}
              aria-label={`View details for ${pokemon.name}`}
            >
              <FiInfo size={12} />
            </button>
          )}
          {onTap && canAddToTeam && (
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110"
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
    </div>
    {peekPopover}
    </>
  );
};

PokemonCard.displayName = "PokemonCard";

export default memo(PokemonCard);
