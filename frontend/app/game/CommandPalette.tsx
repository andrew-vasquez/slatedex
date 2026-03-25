"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { FiSearch, FiPlus, FiTrash2, FiDownload, FiShare2 } from "react-icons/fi";
import { pokemonSpriteSrc } from "@/lib/image";
import type { Pokemon } from "@/lib/types";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  allPokemon: Pokemon[];
  onAddPokemon: (pokemon: Pokemon) => void;
  currentTeamLength: number;
  onClearTeam?: () => void;
  onOpenTools?: () => void;
  onFocusSearch?: () => void;
  onToggleAiCoach?: () => void;
}

interface PaletteItem {
  id: string;
  type: "pokemon" | "action";
  label: string;
  description?: string;
  icon?: React.ReactNode;
  pokemon?: Pokemon;
  action?: () => void;
}

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  if (!q) return false;
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

const CommandPalette = ({
  isOpen,
  onClose,
  allPokemon,
  onAddPokemon,
  currentTeamLength,
  onClearTeam,
  onOpenTools,
  onFocusSearch,
  onToggleAiCoach,
}: CommandPaletteProps) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  const actions: PaletteItem[] = useMemo(() => {
    const items: PaletteItem[] = [];
    if (onFocusSearch) items.push({ id: "search", type: "action", label: "Search Pokémon", description: "Focus the search input", icon: <FiSearch size={14} />, action: () => { onFocusSearch(); onClose(); } });
    if (onToggleAiCoach) items.push({ id: "ai-coach", type: "action", label: "Toggle AI Coach", description: "Open or close the AI Coach panel", icon: <FiSearch size={14} />, action: () => { onToggleAiCoach(); onClose(); } });
    if (onOpenTools) items.push({ id: "tools", type: "action", label: "Open Team Tools", description: "Share, export, or manage your team", icon: <FiShare2 size={14} />, action: () => { onOpenTools(); onClose(); } });
    if (onClearTeam && currentTeamLength > 0) items.push({ id: "clear", type: "action", label: "Clear Team", description: "Remove all Pokémon from your team", icon: <FiTrash2 size={14} />, action: () => { onClearTeam(); onClose(); } });
    return items;
  }, [onFocusSearch, onToggleAiCoach, onOpenTools, onClearTeam, currentTeamLength, onClose]);

  const results: PaletteItem[] = useMemo(() => {
    if (!query.trim()) {
      return [...actions, ...allPokemon.slice(0, 8).map((p): PaletteItem => ({
        id: `poke-${p.id}`,
        type: "pokemon",
        label: p.name,
        description: `#${p.id.toString().padStart(3, "0")} · ${p.types.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join("/")}`,
        pokemon: p,
      }))];
    }

    const matchedActions = actions.filter((a) => fuzzyMatch(query, a.label));
    const matchedPokemon = allPokemon
      .filter((p) => fuzzyMatch(query, p.name) || fuzzyMatch(query, p.id.toString()))
      .slice(0, 20)
      .map((p): PaletteItem => ({
        id: `poke-${p.id}`,
        type: "pokemon",
        label: p.name,
        description: `#${p.id.toString().padStart(3, "0")} · ${p.types.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join("/")}`,
        pokemon: p,
      }));

    return [...matchedActions, ...matchedPokemon];
  }, [query, actions, allPokemon]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const executeItem = useCallback((item: PaletteItem) => {
    if (item.type === "action" && item.action) {
      item.action();
    } else if (item.type === "pokemon" && item.pokemon && currentTeamLength < 6) {
      onAddPokemon(item.pokemon);
      onClose();
    }
  }, [currentTeamLength, onAddPokemon, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      executeItem(results[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  }, [results, selectedIndex, executeItem, onClose]);

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="command-palette-backdrop" onClick={onClose}>
      <div
        className="command-palette"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <div className="command-palette-input-wrap">
          <FiSearch size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search Pokémon or type a command…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="command-palette-input"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="command-palette-kbd">ESC</kbd>
        </div>

        <div ref={listRef} className="command-palette-list">
          {results.length === 0 && (
            <div className="command-palette-empty">No results found</div>
          )}
          {results.map((item, i) => (
            <button
              key={item.id}
              type="button"
              className={`command-palette-item ${i === selectedIndex ? "command-palette-item--active" : ""}`}
              onClick={() => executeItem(item)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              {item.type === "pokemon" && item.pokemon ? (
                <Image
                  src={pokemonSpriteSrc(item.pokemon.sprite, item.pokemon.id)}
                  alt=""
                  width={28}
                  height={28}
                  unoptimized
                  className="h-7 w-7 object-contain"
                />
              ) : (
                <span className="command-palette-action-icon">{item.icon}</span>
              )}
              <div className="min-w-0 flex-1">
                <span className="command-palette-item-label">{item.label}</span>
                {item.description && (
                  <span className="command-palette-item-desc">{item.description}</span>
                )}
              </div>
              {item.type === "pokemon" && currentTeamLength < 6 && (
                <FiPlus size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>

        <div className="command-palette-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
