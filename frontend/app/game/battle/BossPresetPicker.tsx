"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { FiSearch, FiAlertCircle } from "react-icons/fi";
import type { BossPreset } from "@/lib/types";
import { pokemonSpriteFromId } from "@/lib/image";

interface BossPresetPickerProps {
  presets: BossPreset[];
  supported: boolean;
  selectedKey: string | null;
  onSelect: (preset: BossPreset) => void;
  isLoading?: boolean;
  onSwitchToManual?: () => void;
  /** Custom message when presets are in development (e.g. "Battle planner for this game is in the works...") */
  comingSoonMessage?: string;
}

const STAGE_LABELS: Record<string, string> = {
  gym: "Gym",
  elite4: "Elite Four",
  champion: "Champion",
};

const STAGE_ORDER: Record<string, number> = {
  gym: 0,
  elite4: 1,
  champion: 2,
};

export default function BossPresetPicker({
  presets,
  supported,
  selectedKey,
  onSelect,
  isLoading,
  onSwitchToManual,
  comingSoonMessage,
}: BossPresetPickerProps) {
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const filtered = query
      ? presets.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
      : presets;

    const groups: Record<string, BossPreset[]> = {};
    for (const preset of filtered) {
      const key = preset.stage;
      if (!groups[key]) groups[key] = [];
      groups[key].push(preset);
    }

    return Object.entries(groups).sort(([a], [b]) => (STAGE_ORDER[a] ?? 9) - (STAGE_ORDER[b] ?? 9));
  }, [presets, query]);

  if (!supported) {
    return (
      <div className="rounded-xl p-4 text-center space-y-3" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
        <FiAlertCircle size={20} className="mx-auto" style={{ color: "var(--text-muted)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          {comingSoonMessage ?? "Curated boss rosters coming soon for this game"}
        </p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Switch to Manual mode to build a custom opponent team.
        </p>
        {onSwitchToManual && (
          <button
            type="button"
            onClick={onSwitchToManual}
            className="btn-secondary !py-2 !px-4 text-sm"
          >
            Switch to Manual
          </button>
        )}
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-14 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <FiSearch
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "var(--text-muted)" }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search gym leaders, Elite Four..."
          className="auth-input !pl-8 !py-2 !text-sm"
          aria-label="Search boss presets"
        />
      </div>

      {grouped.length === 0 && (
        <div className="text-center py-4 space-y-2">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {query ? "No presets match your search." : "No boss presets for this game."}
          </p>
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-sm font-medium underline hover:no-underline"
              style={{ color: "var(--version-color, var(--accent))" }}
            >
              Clear search
            </button>
          )}
        </div>
      )}

      {grouped.map(([stage, bosses]) => (
        <div key={stage}>
          <p className="mb-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>
            {STAGE_LABELS[stage] ?? stage}
          </p>
          <div className="space-y-1.5">
            {bosses.map((boss) => {
              const isSelected = selectedKey === boss.key;
              return (
                <button
                  key={boss.key}
                  type="button"
                  onClick={() => onSelect(boss)}
                  className="w-full rounded-lg px-3 py-2 flex items-center gap-3 text-left transition-colors duration-150 min-h-[44px]"
                  style={{
                    background: isSelected ? "var(--version-color-soft, var(--accent-soft))" : "var(--surface-2)",
                    border: isSelected
                      ? "1px solid var(--version-color-border, rgba(218, 44, 67, 0.34))"
                      : "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                  aria-pressed={isSelected}
                >
                  {/* Sprite preview row */}
                  <div className="flex -space-x-2 shrink-0">
                    {boss.rosterPokemonIds.slice(0, 4).map((pokemonId, i) => {
                      const src = pokemonSpriteFromId(pokemonId);
                      return src ? (
                        <div
                          key={i}
                          className="w-7 h-7 rounded-full overflow-hidden"
                          style={{ background: "var(--surface-3)", border: "1px solid var(--border)" }}
                        >
                          <Image
                            src={src}
                            alt=""
                            width={28}
                            height={28}
                            className="w-full h-full object-contain scale-110"
                            unoptimized
                          />
                        </div>
                      ) : null;
                    })}
                    {boss.rosterPokemonIds.length > 4 && (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[0.6rem] font-bold"
                        style={{ background: "var(--surface-3)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
                      >
                        +{boss.rosterPokemonIds.length - 4}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{boss.name}</p>
                    <p className="text-[0.68rem] truncate" style={{ color: "var(--text-muted)" }}>
                      {boss.stage === "gym" && boss.gymOrder ? `Gym ${boss.gymOrder}` : STAGE_LABELS[boss.stage]}
                      {" · "}
                      {boss.rosterPokemonIds.length} Pokémon
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
