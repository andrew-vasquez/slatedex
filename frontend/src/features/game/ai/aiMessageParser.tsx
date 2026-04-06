/**
 * Pure parsing and rendering utilities for AI coach messages.
 * No React hooks — safe to import from any component or hook.
 */
import type { ReactNode } from "react";
import { PokemonTypeBadge } from "@/components/ui/PokemonTypeBadge";
import { formatPokemonType } from "@/lib/pokemonTypePalette";
import type { AiBossGuidanceEntry } from "@/lib/api";
import type { Pokemon } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssistantMessageBlock =
  | { type: "heading"; text: string }
  | { type: "unordered"; items: string[] }
  | { type: "ordered"; items: string[] }
  | { type: "paragraph"; text: string };

export type AssistantMessageSection = {
  heading: string;
  blocks: Exclude<AssistantMessageBlock, { type: "heading" }>[];
};

export type CheckpointLegality = {
  catchableNames: string[];
  catchablePoolSize: number;
  blockedFinalNames: string[];
  evolutionFallbacks: Array<{ fromName: string; toName: string }>;
};

// ─── Constants ────────────────────────────────────────────────────────────────

export const POKEMON_TYPE_SET = new Set([
  "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
  "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy",
]);

export const BOSS_SECTION_HEADING_PATTERN = /(boss matchup|boss outlook|gym|elite four|champion)/i;

export const PSEUDO_LEGENDARY_ROOTS = new Set([
  "dratini", "larvitar", "bagon", "beldum", "gible",
  "deino", "goomy", "jangmo-o", "dreepy", "frigibax",
]);

// ─── Checkpoint helpers ───────────────────────────────────────────────────────

export function checkpointKey(entry: AiBossGuidanceEntry): string {
  return `${entry.stage}:${entry.gymOrder ?? 0}:${entry.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export function checkpointLabel(entry: AiBossGuidanceEntry): string {
  const stageLabel =
    entry.stage === "gym"
      ? `Gym ${entry.gymOrder ?? "?"}`
      : entry.stage === "elite4"
        ? "Elite Four"
        : "Champion";
  const levelLabel = entry.recommendedPlayerLevelRange ? ` · ${entry.recommendedPlayerLevelRange}` : "";
  return `${stageLabel} · ${entry.name}${levelLabel}`;
}

export function normalizeSpeciesName(value: string): string {
  return value.trim().toLowerCase();
}

export function getCheckpointEvolutionStageCap(checkpoint: AiBossGuidanceEntry | null): number {
  if (!checkpoint) return 3;
  if (checkpoint.stage !== "gym") return 3;
  const gymOrder = checkpoint.gymOrder ?? 8;
  if (gymOrder <= 1) return 2;
  if (gymOrder <= 5) return 2;
  return 3;
}

export function isLegalAtCheckpoint(pokemon: Pokemon, checkpoint: AiBossGuidanceEntry | null): boolean {
  if (!checkpoint) return true;
  if (checkpoint.stage !== "gym") return true;

  const gymOrder = checkpoint.gymOrder ?? 8;
  if (gymOrder <= 6 && (pokemon.isLegendary || pokemon.isMythical)) return false;

  const stageCap = getCheckpointEvolutionStageCap(checkpoint);
  const stage = typeof pokemon.evolutionStage === "number" && pokemon.evolutionStage > 0 ? pokemon.evolutionStage : 3;
  if (gymOrder <= 1) {
    if (pokemon.isStarterLine) return stage <= 2;
    if (stage > 1) return false;
  } else if (stage > stageCap) {
    return false;
  }

  const evolutionRoot =
    Array.isArray(pokemon.evolutionLine) && pokemon.evolutionLine.length > 0
      ? normalizeSpeciesName(pokemon.evolutionLine[0])
      : normalizeSpeciesName(pokemon.name);
  if (gymOrder <= 5 && PSEUDO_LEGENDARY_ROOTS.has(evolutionRoot) && stage > 1) {
    return false;
  }

  return true;
}

export function estimateCheckpointCatchables(params: {
  checkpoint: AiBossGuidanceEntry | null;
  orderedPokemonPool: Pokemon[];
}): CheckpointLegality {
  const { checkpoint, orderedPokemonPool } = params;
  const empty: CheckpointLegality = { catchableNames: [], catchablePoolSize: 0, blockedFinalNames: [], evolutionFallbacks: [] };
  if (!checkpoint || orderedPokemonPool.length === 0) return empty;

  const stageCap = getCheckpointEvolutionStageCap(checkpoint);
  const legalPool = orderedPokemonPool.filter((pokemon) => isLegalAtCheckpoint(pokemon, checkpoint));
  if (legalPool.length === 0) return empty;

  const legalNames = new Set(legalPool.map((pokemon) => normalizeSpeciesName(pokemon.name)));
  const fallbackMap = new Map<string, string>();
  const blockedFinals = new Set<string>();

  for (const pokemon of orderedPokemonPool) {
    const pokemonName = normalizeSpeciesName(pokemon.name);
    const stage = typeof pokemon.evolutionStage === "number" && pokemon.evolutionStage > 0 ? pokemon.evolutionStage : 3;
    if (pokemon.isFinalEvolution && !legalNames.has(pokemonName)) {
      blockedFinals.add(pokemonName);
    }
    if (stage <= stageCap) continue;
    const line = Array.isArray(pokemon.evolutionLine)
      ? pokemon.evolutionLine.map((name) => normalizeSpeciesName(name)).filter(Boolean)
      : [];
    if (line.length === 0) continue;
    const toName = line[Math.max(0, Math.min(stageCap, line.length) - 1)];
    if (!toName || toName === pokemonName) continue;
    if (legalNames.has(toName)) fallbackMap.set(pokemonName, toName);
  }

  const total = legalPool.length;
  let poolCap = total;
  if (checkpoint.stage === "gym") {
    const progressByGym: Record<number, number> = {
      1: 0.14, 2: 0.24, 3: 0.36, 4: 0.5,
      5: 0.64, 6: 0.78, 7: 0.9, 8: 1,
    };
    const ratio = progressByGym[checkpoint.gymOrder ?? 8] ?? 1;
    poolCap = Math.min(total, Math.max(8, Math.ceil(total * ratio)));
  }

  const checkpointPool = legalPool.slice(0, poolCap).map((pokemon) => normalizeSpeciesName(pokemon.name));
  const sampleSize = Math.min(24, checkpointPool.length);

  const fallbackEntries = Array.from(fallbackMap.entries())
    .map(([fromName, toName]) => ({ fromName, toName }))
    .slice(0, 180);
  const blockedFinalNames = Array.from(blockedFinals).slice(0, 120);

  if (sampleSize === checkpointPool.length) {
    return { catchableNames: checkpointPool, catchablePoolSize: checkpointPool.length, blockedFinalNames, evolutionFallbacks: fallbackEntries };
  }

  const sampled: string[] = [];
  const step = checkpointPool.length / sampleSize;
  for (let index = 0; index < sampleSize; index += 1) {
    const candidate = checkpointPool[Math.floor(index * step)];
    if (candidate && !sampled.includes(candidate)) sampled.push(candidate);
  }

  return { catchableNames: sampled, catchablePoolSize: checkpointPool.length, blockedFinalNames, evolutionFallbacks: fallbackEntries };
}

// ─── Time formatting ──────────────────────────────────────────────────────────

export function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

// ─── Inline text rendering ────────────────────────────────────────────────────

export function normalizeLookupToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9'-]/g, "");
}

function parseCompoundTypeToken(token: string): string[] | null {
  if (!/[/|]/.test(token)) return null;
  const parts = token
    .split(/[/|]+/g)
    .map((part) => part.trim().replace(/-?types?$/i, "").toLowerCase())
    .filter(Boolean);
  if (parts.length < 2) return null;
  if (!parts.every((part) => POKEMON_TYPE_SET.has(part))) return null;
  return parts;
}

export function renderTypePill(type: string, key: string): ReactNode {
  return (
    <PokemonTypeBadge
      key={key}
      pokemonType={type}
      size="xs"
      className="type-badge"
      style={{ lineHeight: 1.4 }}
    >
      {formatPokemonType(type)}
    </PokemonTypeBadge>
  );
}

export function renderStyledInlineText(
  text: string,
  pokemonNameLookup: Set<string>,
  keyPrefix: string
): ReactNode[] {
  const tokens = text.split(/(\s+|[()[\]{}.,!?;:]+)/g).filter((token) => token.length > 0);
  return tokens.map((token, tokenIndex) => {
    if (/^\s+$/.test(token) || /^[()[\]{}.,!?;:]+$/.test(token)) return token;

    const compoundTypes = parseCompoundTypeToken(token);
    if (compoundTypes) {
      return (
        <span
          key={`${keyPrefix}-type-pair-${tokenIndex}`}
          className="mx-0.5 inline-flex items-center gap-1"
          style={{ verticalAlign: "-0.05em", lineHeight: 1.4 }}
        >
          {compoundTypes.map((type, idx) =>
            renderTypePill(type, `${keyPrefix}-type-pair-${tokenIndex}-${idx}`)
          )}
        </span>
      );
    }

    const normalized = normalizeLookupToken(token);
    if (!normalized) return token;

    const strippedTypeSuffix = normalized.endsWith("type")
      ? normalized.replace(/-?type$/, "")
      : normalized;
    if (POKEMON_TYPE_SET.has(strippedTypeSuffix)) {
      return (
        <span
          key={`${keyPrefix}-type-${tokenIndex}`}
          className="mx-0.5 inline-flex items-center"
          style={{ verticalAlign: "-0.05em", lineHeight: 1.4 }}
        >
          {renderTypePill(strippedTypeSuffix, `${keyPrefix}-type-pill-${tokenIndex}`)}
        </span>
      );
    }

    if (pokemonNameLookup.has(normalized)) {
      return (
        <span
          key={`${keyPrefix}-pokemon-${tokenIndex}`}
          className="ai-inline-token ai-inline-token-pokemon"
        >
          {token}
        </span>
      );
    }

    return token;
  });
}

export function splitCoachEntityLine(line: string): { name: string; detail: string } | null {
  const cleaned = line.trim();
  if (!cleaned) return null;

  const withParen = cleaned.match(/^([A-Z][A-Za-z0-9'.&/ -]{1,46})\s*\(([^)]+)\)\s*(?:[:\-–—]\s*)(.+)$/);
  if (withParen) {
    return { name: `${withParen[1].trim()} (${withParen[2].trim()})`, detail: withParen[3].trim() };
  }

  const withSeparator = cleaned.match(/^([A-Z][A-Za-z0-9'.&/ -]{1,46})\s*(?:[:\-–—]\s*)(.+)$/);
  if (withSeparator) {
    return { name: withSeparator[1].trim(), detail: withSeparator[2].trim() };
  }

  return null;
}

// ─── Message parsing ──────────────────────────────────────────────────────────

function isUnorderedListLine(line: string): boolean {
  return /^[-*•]\s+/.test(line);
}

function isOrderedListLine(line: string): boolean {
  return /^\d+[.)]\s+/.test(line);
}

function stripListMarker(line: string): string {
  return line.replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, "").trim();
}

function cleanupMarkdownDecorators(text: string): string {
  return text
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/\s+#{1,6}\s*$/gm, "")
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g, "$1")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*\*([^*]+)\*\*\*/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/~~([^~\n]+)~~/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseAssistantMessage(content: string): AssistantMessageBlock[] {
  const normalized = content.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [{ type: "paragraph", text: "" }];
  const blocks: AssistantMessageBlock[] = [];
  const lines = normalized.split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) { index += 1; continue; }

    const markdownHeading = line.match(/^#{1,6}\s*(.+)$/);
    if (markdownHeading) {
      const heading = cleanupMarkdownDecorators(markdownHeading[1]);
      if (heading) blocks.push({ type: "heading", text: heading });
      index += 1;
      continue;
    }

    const sectionHeading = line.match(/^([A-Za-z][^:]{1,64}):$/);
    if (sectionHeading) {
      const heading = cleanupMarkdownDecorators(sectionHeading[1]);
      if (heading) blocks.push({ type: "heading", text: heading });
      index += 1;
      continue;
    }

    if (isUnorderedListLine(line)) {
      const items: string[] = [];
      while (index < lines.length && isUnorderedListLine(lines[index].trim())) {
        items.push(cleanupMarkdownDecorators(stripListMarker(lines[index].trim())));
        index += 1;
      }
      if (items.length > 0) blocks.push({ type: "unordered", items });
      continue;
    }

    if (isOrderedListLine(line)) {
      const items: string[] = [];
      while (index < lines.length && isOrderedListLine(lines[index].trim())) {
        items.push(cleanupMarkdownDecorators(stripListMarker(lines[index].trim())));
        index += 1;
      }
      if (items.length > 0) blocks.push({ type: "ordered", items });
      continue;
    }

    const paragraphLines: string[] = [line];
    index += 1;
    while (index < lines.length) {
      const candidate = lines[index].trim();
      if (!candidate) break;
      if (
        /^#{1,6}\s*/.test(candidate) ||
        /^([A-Za-z][^:]{1,64}):$/.test(candidate) ||
        isUnorderedListLine(candidate) ||
        isOrderedListLine(candidate)
      ) break;
      paragraphLines.push(candidate);
      index += 1;
    }
    blocks.push({ type: "paragraph", text: cleanupMarkdownDecorators(paragraphLines.join("\n")) });
  }

  return blocks.length > 0 ? blocks : [{ type: "paragraph", text: cleanupMarkdownDecorators(normalized) }];
}

export function groupAssistantBlocks(blocks: AssistantMessageBlock[]): AssistantMessageSection[] {
  const sections: AssistantMessageSection[] = [];
  let currentSection: AssistantMessageSection | null = null;

  for (const block of blocks) {
    if (block.type === "heading") {
      const nextSection: AssistantMessageSection = { heading: block.text, blocks: [] };
      sections.push(nextSection);
      currentSection = nextSection;
      continue;
    }
    if (!currentSection) {
      currentSection = { heading: "Overview", blocks: [] };
      sections.push(currentSection);
    }
    currentSection.blocks.push(block);
  }

  return sections.filter((section) => section.blocks.length > 0);
}
