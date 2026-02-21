"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiChevronDown, FiMapPin } from "react-icons/fi";
import { pokemonSpriteSrc } from "@/lib/image";
import type { Pokemon } from "@/lib/types";

interface TeamCaptureGuideProps {
  team: (Pokemon | null)[];
  selectedVersionId: string;
  selectedVersionLabel: string;
  compactMode?: boolean;
}

interface CaptureGuideEncounter {
  location: string;
  method: string;
  levelText: string | null;
  chance: number | null;
  conditions: string[];
}

interface CaptureGuideData {
  pokemonId: number;
  pokemonName: string;
  sourcePokemonName: string;
  sourcePokemonId: number;
  requiresEvolution: boolean;
  evolutionPath: string[];
  encounters: CaptureGuideEncounter[];
  evolutionSteps: Array<{
    from: string;
    to: string;
    trigger: string;
    requirement: string | null;
  }>;
  alternativeSources: Array<{
    pokemonName: string;
    pokemonId: number;
    encounters: CaptureGuideEncounter[];
  }>;
  note: string | null;
}

interface GuideState {
  status: "loading" | "ready" | "error";
  data: CaptureGuideData | null;
}

const CAPTURE_GUIDE_CACHE_VERSION = "7";

function normalizeCaptureGuideData(raw: unknown, fallback: { id: number; name: string }): CaptureGuideData {
  const data = raw && typeof raw === "object" ? (raw as Partial<CaptureGuideData>) : {};

  const encounters = Array.isArray(data.encounters)
    ? data.encounters.map((encounter) => ({
      location: typeof encounter?.location === "string" ? encounter.location : "Unknown location",
      method: typeof encounter?.method === "string" ? encounter.method : "Unknown method",
      levelText: typeof encounter?.levelText === "string" ? encounter.levelText : null,
      chance: typeof encounter?.chance === "number" && Number.isFinite(encounter.chance) ? encounter.chance : null,
      conditions: Array.isArray(encounter?.conditions)
        ? encounter.conditions.filter((value): value is string => typeof value === "string")
        : [],
    }))
    : [];

  const evolutionPath = Array.isArray(data.evolutionPath)
    ? data.evolutionPath.filter((value): value is string => typeof value === "string")
    : [];

  const evolutionSteps = Array.isArray(data.evolutionSteps)
    ? data.evolutionSteps.map((step) => ({
      from: typeof step?.from === "string" ? step.from : "",
      to: typeof step?.to === "string" ? step.to : "",
      trigger: typeof step?.trigger === "string" ? step.trigger : "Evolve",
      requirement: typeof step?.requirement === "string" ? step.requirement : null,
    }))
    : [];

  const alternativeSources = Array.isArray(data.alternativeSources)
    ? data.alternativeSources
        .filter((src): src is { pokemonName: string; pokemonId: number; encounters: CaptureGuideEncounter[] } =>
          typeof src?.pokemonName === "string" && typeof src?.pokemonId === "number")
        .map((src) => ({
          pokemonName: src.pokemonName,
          pokemonId: src.pokemonId,
          encounters: Array.isArray(src.encounters)
            ? src.encounters.map((e) => ({
                location: typeof e?.location === "string" ? e.location : "Unknown location",
                method: typeof e?.method === "string" ? e.method : "Unknown method",
                levelText: typeof e?.levelText === "string" ? e.levelText : null,
                chance: typeof e?.chance === "number" && Number.isFinite(e.chance) ? e.chance : null,
                conditions: Array.isArray(e?.conditions) ? e.conditions.filter((v): v is string => typeof v === "string") : [],
              }))
            : [],
        }))
    : [];

  return {
    pokemonId: typeof data.pokemonId === "number" ? data.pokemonId : fallback.id,
    pokemonName: typeof data.pokemonName === "string" ? data.pokemonName : fallback.name,
    sourcePokemonName: typeof data.sourcePokemonName === "string" ? data.sourcePokemonName : fallback.name,
    sourcePokemonId: typeof data.sourcePokemonId === "number" ? data.sourcePokemonId : fallback.id,
    requiresEvolution: typeof data.requiresEvolution === "boolean" ? data.requiresEvolution : false,
    evolutionPath,
    encounters,
    evolutionSteps,
    alternativeSources,
    note: typeof data.note === "string" ? data.note : null,
  };
}

function parseRouteNumber(location: string): number | null {
  const match = location.match(/Route\s+(\d+)/i);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function parseMinLevel(levelText: string | null): number | null {
  if (!levelText) return null;
  const match = levelText.match(/\d+/);
  if (!match) return null;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : null;
}

const GIFT_METHODS = new Set(["gift", "only one"]);

function isGiftMethod(method: string): boolean {
  return GIFT_METHODS.has(method.toLowerCase().replace(/-/g, " "));
}

const TeamCaptureGuide = ({
  team,
  selectedVersionId,
  selectedVersionLabel,
  compactMode = false,
}: TeamCaptureGuideProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [guideByPokemonId, setGuideByPokemonId] = useState<Record<number, GuideState>>({});
  const cacheRef = useRef<Map<string, CaptureGuideData>>(new Map());

  const teamPokemon = useMemo(() => team.filter((pokemon): pokemon is Pokemon => pokemon !== null), [team]);
  const uniqueTeamPokemon = useMemo(
    () => Array.from(new Map(teamPokemon.map((pokemon) => [pokemon.id, pokemon])).values()),
    [teamPokemon]
  );
  const [isChecklistVisible, setIsChecklistVisible] = useState(true);
  const [checkedPokemonIds, setCheckedPokemonIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    try {
      const stored = localStorage.getItem("capture_checklist_visible_v1");
      if (stored === "false") setIsChecklistVisible(false);
    } catch { /* noop */ }
    try {
      const stored = localStorage.getItem(`checklist_checked_${selectedVersionId}_v1`);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        if (Array.isArray(parsed)) setCheckedPokemonIds(new Set(parsed.filter(Number.isFinite)));
      } else {
        setCheckedPokemonIds(new Set());
      }
    } catch { /* noop */ }
  }, [selectedVersionId]);

  const toggleChecklist = useCallback(() => {
    setIsChecklistVisible((prev) => {
      const next = !prev;
      try { localStorage.setItem("capture_checklist_visible_v1", String(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  const togglePokemonChecked = useCallback((pokemonId: number) => {
    setCheckedPokemonIds((prev) => {
      const next = new Set(prev);
      if (next.has(pokemonId)) next.delete(pokemonId);
      else next.add(pokemonId);
      try { localStorage.setItem(`checklist_checked_${selectedVersionId}_v1`, JSON.stringify([...next])); } catch { /* noop */ }
      return next;
    });
  }, [selectedVersionId]);

  const routeChecklist = useMemo(() => {
    const byLocation = new Map<
      string,
      {
        location: string;
        routeNumber: number | null;
        members: Array<{
          pokemonId: number;
          targetName: string;
          sourceName: string;
          requiresEvolution: boolean;
          method: string;
          levelText: string | null;
          chance: number | null;
        }>;
      }
    >();

    teamPokemon.forEach((pokemon) => {
      const state = guideByPokemonId[pokemon.id];
      const data = state?.data;
      const encounters = data?.encounters ?? [];
      if (!state || state.status !== "ready" || !data || encounters.length === 0) return;
      const topEncounter = encounters[0];
      const current = byLocation.get(topEncounter.location) ?? {
        location: topEncounter.location,
        routeNumber: parseRouteNumber(topEncounter.location),
        members: [],
      };
      current.members.push({
        pokemonId: pokemon.id,
        targetName: pokemon.name,
        sourceName: data.sourcePokemonName,
        requiresEvolution: data.requiresEvolution,
        method: topEncounter.method,
        levelText: topEncounter.levelText,
        chance: topEncounter.chance,
      });
      byLocation.set(topEncounter.location, current);
    });

    if (byLocation.size === 0) return [];

    return Array.from(byLocation.values()).sort((a, b) => {
      // Gifts/starters come first (received before any routes)
      const giftA = a.members.some((m) => isGiftMethod(m.method));
      const giftB = b.members.some((m) => isGiftMethod(m.method));
      if (giftA && !giftB) return -1;
      if (!giftA && giftB) return 1;

      // Routes sorted by number
      if (a.routeNumber !== null && b.routeNumber !== null) return a.routeNumber - b.routeNumber;
      if (a.routeNumber !== null) return -1;
      if (b.routeNumber !== null) return 1;

      // Non-route locations sorted by lowest encounter level (earlier in game = lower level)
      const minLevelA = Math.min(...a.members.map((m) => parseMinLevel(m.levelText) ?? 999));
      const minLevelB = Math.min(...b.members.map((m) => parseMinLevel(m.levelText) ?? 999));
      if (minLevelA !== minLevelB) return minLevelA - minLevelB;

      return a.location.localeCompare(b.location);
    });
  }, [guideByPokemonId, teamPokemon]);

  useEffect(() => {
    if (teamPokemon.length === 0) {
      setIsOpen(false);
    }
  }, [teamPokemon.length]);

  useEffect(() => {
    if (!selectedVersionId || uniqueTeamPokemon.length === 0) {
      setGuideByPokemonId({});
      return;
    }

    let cancelled = false;
    const versionScopedStates: Record<number, GuideState> = {};

    uniqueTeamPokemon.forEach((pokemon) => {
      const cacheKey = `${pokemon.id}:${selectedVersionId}`;
      if (cacheRef.current.has(cacheKey)) {
        versionScopedStates[pokemon.id] = {
          status: "ready",
          data: cacheRef.current.get(cacheKey) ?? null,
        };
      } else {
        versionScopedStates[pokemon.id] = { status: "loading", data: null };
      }
    });

    setGuideByPokemonId(versionScopedStates);

    const pending = uniqueTeamPokemon.filter((pokemon) => {
      const cacheKey = `${pokemon.id}:${selectedVersionId}`;
      return !cacheRef.current.has(cacheKey);
    });

    if (pending.length === 0) return;

    Promise.allSettled(
      pending.map(async (pokemon) => {
        const response = await fetch(
          `/api/pokemon-capture-guide?pokemonId=${pokemon.id}&versionId=${encodeURIComponent(selectedVersionId)}&cv=${CAPTURE_GUIDE_CACHE_VERSION}`,
          { cache: "force-cache" }
        );
        if (!response.ok) {
          throw new Error(`Failed to load capture guide for ${pokemon.name}`);
        }
        const rawPayload = (await response.json()) as unknown;
        const payload = normalizeCaptureGuideData(rawPayload, {
          id: pokemon.id,
          name: pokemon.name,
        });
        return { pokemonId: pokemon.id, payload };
      })
    ).then((results) => {
      if (cancelled) return;

      setGuideByPokemonId((prev) => {
        const next = { ...prev };

        results.forEach((result, index) => {
          const pokemonId = pending[index].id;
          if (result.status === "fulfilled") {
            const cacheKey = `${pokemonId}:${selectedVersionId}`;
            cacheRef.current.set(cacheKey, result.value.payload);
            next[pokemonId] = { status: "ready", data: result.value.payload };
          } else {
            next[pokemonId] = { status: "error", data: null };
          }
        });

        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [selectedVersionId, uniqueTeamPokemon]);

  if (teamPokemon.length === 0) return null;

  return (
    <section className="panel p-3.5 sm:p-4" style={{ background: "linear-gradient(180deg, var(--surface-1), var(--surface-2))" }}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group inline-flex w-full items-center justify-between rounded-lg border px-2.5 py-2 text-left"
        style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        aria-expanded={isOpen}
        aria-controls="team-capture-guide-panel"
      >
        <span>
          <span className="flex items-center gap-1.5 text-[0.76rem] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-primary)" }}>
            <FiMapPin size={12} aria-hidden="true" />
            Capture Guide
            {compactMode ? (
              <span
                className="rounded-full px-1.5 py-0.5 text-[0.64rem] font-semibold uppercase tracking-[0.08em]"
                style={{ border: "1px solid var(--border)", color: "var(--text-muted)", background: "var(--surface-1)" }}
              >
                compact
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 block text-[0.74rem]" style={{ color: "var(--text-muted)" }}>
            Route and encounter methods for {selectedVersionLabel}.
          </span>
        </span>
        <FiChevronDown
          size={14}
          aria-hidden="true"
          style={{
            color: "var(--text-muted)",
            transform: isOpen ? "rotate(180deg)" : "none",
            transition: "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </button>

      <div
        id="team-capture-guide-panel"
        className={`grid overflow-hidden transition-[grid-template-rows,opacity,margin-top] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? "mt-2 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0 pointer-events-none"
        }`}
      >
        <div className="min-h-0">
          <div className="space-y-2.5">
            {routeChecklist.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em]" style={{ color: "var(--text-muted)" }}>
                    Route Checklist
                    <span className="ml-1.5 normal-case tracking-normal" style={{ color: "var(--text-muted)", opacity: 0.7 }}>
                      · {routeChecklist.reduce((sum, stop) => sum + stop.members.filter((m) => checkedPokemonIds.has(m.pokemonId)).length, 0)}/{routeChecklist.reduce((sum, stop) => sum + stop.members.length, 0)} caught
                    </span>
                  </p>
                  <button
                    type="button"
                    onClick={toggleChecklist}
                    className="rounded-full border px-2 py-0.5 text-[0.64rem] font-semibold uppercase tracking-[0.06em] transition-colors"
                    style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-muted)" }}
                    aria-label={isChecklistVisible ? "Hide route checklist" : "Show route checklist"}
                  >
                    {isChecklistVisible ? "Hide" : "Show"}
                  </button>
                </div>

                {isChecklistVisible && (
                  <ol className="space-y-1">
                    {routeChecklist.map((stop, index) => {
                      const allChecked = stop.members.every((m) => checkedPokemonIds.has(m.pokemonId));
                      return (
                        <li
                          key={stop.location}
                          className="flex items-start gap-2 rounded-md border px-2 py-1.5 transition-opacity duration-200"
                          style={{
                            borderColor: "var(--border)",
                            background: "rgba(8, 15, 34, 0.42)",
                            opacity: allChecked ? 0.5 : 1,
                          }}
                        >
                          <span
                            className="mt-0.5 flex h-[1.15rem] w-[1.15rem] shrink-0 items-center justify-center rounded-full text-[0.56rem] font-bold"
                            style={{ background: "var(--accent-soft)", color: "var(--accent)", border: "1px solid rgba(218, 44, 67, 0.18)" }}
                            aria-hidden="true"
                          >
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[0.76rem] font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>
                              {stop.location}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {stop.members.map((member) => {
                                const isChecked = checkedPokemonIds.has(member.pokemonId);
                                return (
                                  <button
                                    key={member.pokemonId}
                                    type="button"
                                    onClick={() => togglePokemonChecked(member.pokemonId)}
                                    className="inline-flex cursor-pointer items-baseline gap-1 rounded-full border px-1.5 py-0.5 text-[0.64rem] transition-all duration-200"
                                    style={{
                                      borderColor: isChecked ? "rgba(74, 222, 128, 0.3)" : "var(--border)",
                                      background: isChecked ? "rgba(74, 222, 128, 0.1)" : "var(--surface-1)",
                                      color: "var(--text-secondary)",
                                      opacity: isChecked ? 0.65 : 1,
                                      textDecoration: isChecked ? "line-through" : "none",
                                    }}
                                    aria-label={`Mark ${member.sourceName}${member.requiresEvolution ? ` for ${member.targetName}` : ""} as ${isChecked ? "not caught" : "caught"}`}
                                  >
                                    <span
                                      className="inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-sm text-[0.5rem]"
                                      style={{
                                        border: isChecked ? "1px solid rgba(74, 222, 128, 0.5)" : "1px solid var(--border)",
                                        background: isChecked ? "rgba(74, 222, 128, 0.25)" : "transparent",
                                        color: isChecked ? "#86efac" : "transparent",
                                      }}
                                      aria-hidden="true"
                                    >
                                      {isChecked ? "✓" : ""}
                                    </span>
                                    <span className="font-semibold">
                                      {member.sourceName}
                                      {member.requiresEvolution && (
                                        <span style={{ color: "var(--text-muted)", textDecoration: "none" }}> → {member.targetName}</span>
                                      )}
                                    </span>
                                    <span style={{ color: "var(--text-muted)" }}>
                                      {member.method}{member.chance !== null ? ` · ${member.chance}%` : ""}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-2">
              {teamPokemon.map((pokemon, index) => {
                const guide = guideByPokemonId[pokemon.id];
                const evolutionSteps = guide?.data?.evolutionSteps ?? [];
                const encounters = guide?.data?.encounters ?? [];
                return (
                  <article
                    key={`${pokemon.id}-${index}`}
                    className="rounded-lg border p-2.5"
                    style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border"
                        style={{ borderColor: "var(--border)", background: "rgba(8, 15, 34, 0.55)" }}
                      >
                        <Image src={pokemonSpriteSrc(pokemon.sprite, pokemon.id)} alt={pokemon.name} width={32} height={32} className="h-8 w-8 object-contain" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                          {pokemon.name}
                        </p>
                        {guide?.status === "loading" && (
                          <p className="text-[0.74rem]" style={{ color: "var(--text-muted)" }}>
                            Loading encounter data...
                          </p>
                        )}
                        {guide?.status === "error" && (
                          <p className="text-[0.74rem]" style={{ color: "#fca5a5" }}>
                            Couldn&apos;t load encounter data right now.
                          </p>
                        )}
                        {guide?.status === "ready" && guide.data && (
                          <div className="space-y-1.5">
                            {guide.data.requiresEvolution && (
                              <p className="text-[0.74rem]" style={{ color: "var(--text-secondary)" }}>
                                Catch <span className="font-semibold">{guide.data.sourcePokemonName}</span>
                                {" "}and evolve to {guide.data.pokemonName}.
                              </p>
                            )}

                            {!compactMode && evolutionSteps.length > 0 ? (
                              <div className="rounded-md border px-2 py-1.5" style={{ borderColor: "var(--border)", background: "rgba(8, 15, 34, 0.42)" }}>
                                <p className="text-[0.66rem] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--text-muted)" }}>
                                  Evolution Path
                                </p>
                                <div className="mt-1 space-y-0.5">
                                  {evolutionSteps.map((step, stepIndex) => (
                                    <p key={`${pokemon.id}-step-${stepIndex}`} className="text-[0.72rem]" style={{ color: "var(--text-secondary)" }}>
                                      {step.from} → {step.to}: {step.trigger}
                                      {step.requirement ? ` (${step.requirement})` : ""}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            {guide.data.note ? (
                              <p className="text-[0.74rem]" style={{ color: "var(--text-muted)" }}>
                                {guide.data.note}
                              </p>
                            ) : null}

                            {encounters.length > 0 ? (
                              <div className="space-y-1">
                                {encounters.slice(0, compactMode ? 1 : 3).map((encounter, encounterIndex) => (
                                  <div
                                    key={`${pokemon.id}-encounter-${encounterIndex}`}
                                    className="rounded-md border px-2 py-1.5"
                                    style={{ borderColor: "var(--border)", background: "rgba(8, 15, 34, 0.42)" }}
                                  >
                                    <p className="text-[0.76rem] font-semibold" style={{ color: "var(--text-primary)" }}>
                                      {encounter.location}
                                    </p>
                                    <p className="text-[0.72rem]" style={{ color: "var(--text-secondary)" }}>
                                      {encounter.method}
                                      {encounter.levelText ? ` · ${encounter.levelText}` : ""}
                                      {encounter.chance !== null ? ` · ${encounter.chance}%` : ""}
                                      {encounter.conditions.length > 0 ? ` · ${encounter.conditions.join(", ")}` : ""}
                                    </p>
                                  </div>
                                ))}
                                {compactMode && encounters.length > 1 ? (
                                  <p className="text-[0.68rem]" style={{ color: "var(--text-muted)" }}>
                                    +{encounters.length - 1} more locations available
                                  </p>
                                ) : null}
                              </div>
                            ) : (
                              <p className="text-[0.74rem]" style={{ color: "var(--text-muted)" }}>
                                No wild encounter locations were found for this version.
                              </p>
                            )}

                            {!compactMode && guide.data.alternativeSources.length > 0 && (
                              <div className="mt-1.5 space-y-1">
                                {guide.data.alternativeSources.map((alt) => (
                                  <div key={alt.pokemonId}>
                                    <p className="text-[0.72rem] font-semibold" style={{ color: "var(--text-secondary)" }}>
                                      Also catchable as <span style={{ color: "var(--version-color, var(--accent))" }}>{alt.pokemonName}</span>
                                    </p>
                                    {alt.encounters.slice(0, 2).map((encounter, ei) => (
                                      <div
                                        key={`${alt.pokemonId}-alt-${ei}`}
                                        className="mt-0.5 rounded-md border px-2 py-1"
                                        style={{ borderColor: "var(--border)", background: "rgba(8, 15, 34, 0.3)" }}
                                      >
                                        <p className="text-[0.72rem] font-semibold" style={{ color: "var(--text-primary)" }}>
                                          {encounter.location}
                                        </p>
                                        <p className="text-[0.68rem]" style={{ color: "var(--text-secondary)" }}>
                                          {encounter.method}
                                          {encounter.levelText ? ` · ${encounter.levelText}` : ""}
                                          {encounter.chance !== null ? ` · ${encounter.chance}%` : ""}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamCaptureGuide;
