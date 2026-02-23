"use client";

import { useState, useDeferredValue, useMemo } from "react";
import Image from "next/image";
import { FiSearch, FiX, FiPlus } from "react-icons/fi";
import type { Pokemon } from "@/lib/types";
import { pokemonSpriteSrc } from "@/lib/image";

interface OpponentTeamEditorProps {
  slots: (Pokemon | null)[];
  onSlotsChange: (slots: (Pokemon | null)[]) => void;
  pokemonPool: Pokemon[];
}

export default function OpponentTeamEditor({
  slots,
  onSlotsChange,
  pokemonPool,
}: OpponentTeamEditorProps) {
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  const filteredPool = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return pokemonPool.slice(0, 40);
    const byId = pokemonPool.find((p) => String(p.id) === q);
    const byName = pokemonPool.filter((p) =>
      p.name.toLowerCase().includes(q)
    );
    return byId ? [byId, ...byName.filter((p) => p.id !== byId.id)].slice(0, 40) : byName.slice(0, 40);
  }, [deferredQuery, pokemonPool]);

  const handleSelectPokemon = (pokemon: Pokemon) => {
    if (activeSlotIndex === null) return;
    const next = [...slots];
    next[activeSlotIndex] = pokemon;
    onSlotsChange(next);
    // Move to next empty slot
    const nextEmpty = next.findIndex((s, i) => s === null && i > activeSlotIndex);
    setActiveSlotIndex(nextEmpty >= 0 ? nextEmpty : null);
    setQuery("");
  };

  const handleClearSlot = (index: number) => {
    const next = [...slots];
    next[index] = null;
    onSlotsChange(next);
    if (activeSlotIndex === index) setActiveSlotIndex(null);
  };

  return (
    <div className="space-y-3">
      {/* 6-slot grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {slots.map((pokemon, index) => {
          const isActive = activeSlotIndex === index;
          return (
            <div key={index} className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveSlotIndex(isActive ? null : index);
                  setQuery("");
                }}
                className="relative w-full aspect-square rounded-lg flex flex-col items-center justify-center transition-all duration-150 min-h-[56px]"
                style={{
                  background: isActive
                    ? "var(--version-color-soft, var(--accent-soft))"
                    : pokemon
                    ? "var(--surface-2)"
                    : "var(--surface-1)",
                  border: isActive
                    ? "1.5px solid var(--version-color-border, rgba(218, 44, 67, 0.6))"
                    : pokemon
                    ? "1px solid var(--border)"
                    : "1px dashed var(--border)",
                }}
                aria-label={
                  pokemon
                    ? `Slot ${index + 1}: ${pokemon.name}. Click to change.`
                    : `Slot ${index + 1}: empty. Click to add.`
                }
              >
                {pokemon ? (
                  <>
                    <Image
                      src={pokemonSpriteSrc(pokemon.sprite, pokemon.id)}
                      alt={pokemon.name}
                      width={40}
                      height={40}
                      className="object-contain"
                      unoptimized
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearSlot(index);
                      }}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background: "var(--surface-3)", border: "1px solid var(--border)" }}
                      aria-label={`Remove ${pokemon.name} from slot ${index + 1}`}
                    >
                      <FiX size={8} style={{ color: "var(--text-muted)" }} />
                    </button>
                  </>
                ) : (
                  <FiPlus size={16} style={{ color: "var(--text-muted)" }} />
                )}
              </button>
              {pokemon && (
                <span
                  className="text-[0.6rem] font-medium text-center truncate w-full px-0.5 capitalize"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {pokemon.name}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Search panel when a slot is active */}
      {activeSlotIndex !== null && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="p-2" style={{ background: "var(--surface-2)" }}>
            <div className="relative">
              <FiSearch
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search Pokémon for slot ${activeSlotIndex + 1}…`}
                className="auth-input !pl-7 !py-1.5 !text-sm"
                autoFocus
                aria-label="Search Pokémon"
              />
            </div>
          </div>
          <div
            className="max-h-48 overflow-y-auto custom-scrollbar"
            style={{ background: "var(--surface-1)" }}
          >
            {filteredPool.length === 0 ? (
              <p className="py-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                No Pokémon found
              </p>
            ) : (
              <div className="grid grid-cols-1 divide-y" style={{ borderColor: "var(--border)" }}>
                {filteredPool.map((pokemon) => (
                  <button
                    key={pokemon.id}
                    type="button"
                    onClick={() => handleSelectPokemon(pokemon)}
                    className="flex items-center gap-2.5 px-3 py-2 text-left w-full hover:bg-[var(--version-color-soft,var(--accent-soft))] transition-colors duration-100 min-h-[44px]"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <Image
                      src={pokemonSpriteSrc(pokemon.sprite, pokemon.id)}
                      alt={pokemon.name}
                      width={28}
                      height={28}
                      className="shrink-0 object-contain"
                      unoptimized
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium capitalize truncate" style={{ color: "var(--text-primary)" }}>
                        {pokemon.name}
                      </p>
                      <p className="text-[0.65rem] capitalize" style={{ color: "var(--text-muted)" }}>
                        {pokemon.types.join(" / ")}
                      </p>
                    </div>
                    <span className="ml-auto text-[0.65rem] font-mono shrink-0" style={{ color: "var(--text-muted)" }}>
                      #{String(pokemon.id).padStart(3, "0")}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
