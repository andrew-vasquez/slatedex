import { NextResponse } from "next/server";
import Pokedex from "pokedex-promise-v2";

export const revalidate = 3600;

interface EncounterEntry {
  location: string;
  method: string;
  levelText: string | null;
  chance: number | null;
  conditions: string[];
}

interface CaptureGuideResponse {
  pokemonId: number;
  pokemonName: string;
  sourcePokemonName: string;
  sourcePokemonId: number;
  requiresEvolution: boolean;
  evolutionPath: string[];
  evolutionSteps: Array<{
    from: string;
    to: string;
    trigger: string;
    requirement: string | null;
  }>;
  encounters: EncounterEntry[];
  note: string | null;
}

const pokedex = new Pokedex({ cacheLimit: 300 * 1000 });
const requestCache = new Map<string, Promise<CaptureGuideResponse>>();

function titleCase(value: string): string {
  return value
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatLocationName(raw: string): string {
  const cleaned = raw
    .replace(/-area$/i, "")
    .replace(/-unknown$/i, "")
    .replace(/-?pokecenter-?1f$/i, " pokecenter")
    .replace(/-?pokemon-center-?1f$/i, " pokecenter");
  return titleCase(cleaned);
}

function formatMethodName(raw: string): string {
  return titleCase(raw);
}

function formatConditionName(raw: string): string {
  const withoutPrefix = raw.replace(/^time-/, "");
  return titleCase(withoutPrefix);
}

function formatLevelText(minLevel: number | null, maxLevel: number | null): string | null {
  if (minLevel === null && maxLevel === null) return null;
  if (minLevel !== null && maxLevel !== null && minLevel !== maxLevel) return `Lv ${minLevel}-${maxLevel}`;
  const value = minLevel ?? maxLevel;
  return value !== null ? `Lv ${value}` : null;
}

function formatEvolutionTrigger(detail: Record<string, unknown> | null): {
  trigger: string;
  requirement: string | null;
} {
  if (!detail) {
    return { trigger: "Evolve", requirement: null };
  }

  const triggerRaw =
    typeof detail.trigger === "object" &&
    detail.trigger &&
    typeof (detail.trigger as { name?: unknown }).name === "string"
      ? ((detail.trigger as { name: string }).name ?? "")
      : "";

  const trigger = triggerRaw ? formatMethodName(triggerRaw) : "Evolve";
  const requirements: string[] = [];

  if (typeof detail.min_level === "number") requirements.push(`Lv ${detail.min_level}`);
  if (typeof detail.time_of_day === "string" && detail.time_of_day) requirements.push(formatConditionName(detail.time_of_day));
  if (typeof detail.needs_overworld_rain === "boolean" && detail.needs_overworld_rain) requirements.push("Rain");
  if (typeof detail.min_happiness === "number") requirements.push(`Happiness ${detail.min_happiness}+`);
  if (typeof detail.min_affection === "number") requirements.push(`Affection ${detail.min_affection}+`);
  if (typeof detail.min_beauty === "number") requirements.push(`Beauty ${detail.min_beauty}+`);
  if (typeof detail.relative_physical_stats === "number") {
    const statRule =
      detail.relative_physical_stats > 0
        ? "Attack > Defense"
        : detail.relative_physical_stats < 0
          ? "Defense > Attack"
          : "Attack = Defense";
    requirements.push(statRule);
  }
  if (typeof detail.turn_upside_down === "boolean" && detail.turn_upside_down) requirements.push("Turn device upside down");

  if (typeof detail.item === "object" && detail.item && typeof (detail.item as { name?: unknown }).name === "string") {
    requirements.push(`Use ${titleCase((detail.item as { name: string }).name)}`);
  }
  if (
    typeof detail.held_item === "object" &&
    detail.held_item &&
    typeof (detail.held_item as { name?: unknown }).name === "string"
  ) {
    requirements.push(`Hold ${titleCase((detail.held_item as { name: string }).name)}`);
  }
  if (
    typeof detail.known_move === "object" &&
    detail.known_move &&
    typeof (detail.known_move as { name?: unknown }).name === "string"
  ) {
    requirements.push(`Know ${titleCase((detail.known_move as { name: string }).name)}`);
  }
  if (
    typeof detail.known_move_type === "object" &&
    detail.known_move_type &&
    typeof (detail.known_move_type as { name?: unknown }).name === "string"
  ) {
    requirements.push(`Know ${titleCase((detail.known_move_type as { name: string }).name)}-type move`);
  }
  if (
    typeof detail.location === "object" &&
    detail.location &&
    typeof (detail.location as { name?: unknown }).name === "string"
  ) {
    requirements.push(`At ${formatLocationName((detail.location as { name: string }).name)}`);
  }
  if (
    typeof detail.trade_species === "object" &&
    detail.trade_species &&
    typeof (detail.trade_species as { name?: unknown }).name === "string"
  ) {
    requirements.push(`Trade for ${titleCase((detail.trade_species as { name: string }).name)}`);
  }

  if (requirements.length === 0 && trigger.toLowerCase().includes("trade")) {
    requirements.push("Trade with another player");
  }

  return {
    trigger,
    requirement: requirements.length > 0 ? requirements.join(" · ") : null,
  };
}

type EvolutionPathNode = {
  name: string;
  incomingDetails: Array<Record<string, unknown>>;
};

function findEvolutionPathToTarget(
  node: Record<string, unknown> | null,
  targetSpeciesName: string,
  path: EvolutionPathNode[] = []
): EvolutionPathNode[] | null {
  if (!node || typeof node !== "object") return null;
  const species =
    typeof node.species === "object" && node.species
      ? (node.species as { name?: unknown })
      : null;
  const currentName = typeof species?.name === "string" ? species.name : null;
  if (!currentName) return null;

  const currentPath = [
    ...path,
    {
      name: currentName,
      incomingDetails: Array.isArray(node.evolution_details)
        ? (node.evolution_details as Array<Record<string, unknown>>)
        : [],
    },
  ];

  if (currentName === targetSpeciesName) return currentPath;

  const children = Array.isArray(node.evolves_to) ? (node.evolves_to as Array<Record<string, unknown>>) : [];
  for (const child of children) {
    const result = findEvolutionPathToTarget(child, targetSpeciesName, currentPath);
    if (result) return result;
  }
  return null;
}

function buildEvolutionSteps(
  pathToTarget: EvolutionPathNode[] | null,
  sourceSpeciesName: string,
  targetSpeciesName: string
): CaptureGuideResponse["evolutionSteps"] {
  if (!pathToTarget || pathToTarget.length === 0) return [];

  const sourceIndex = pathToTarget.findIndex((entry) => entry.name === sourceSpeciesName);
  const targetIndex = pathToTarget.findIndex((entry) => entry.name === targetSpeciesName);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex >= targetIndex) return [];

  const steps: CaptureGuideResponse["evolutionSteps"] = [];
  for (let index = sourceIndex + 1; index <= targetIndex; index += 1) {
    const from = pathToTarget[index - 1];
    const to = pathToTarget[index];
    const detail = to.incomingDetails.length > 0 ? to.incomingDetails[0] : null;
    const triggerInfo = formatEvolutionTrigger(detail);
    steps.push({
      from: titleCase(from.name),
      to: titleCase(to.name),
      trigger: triggerInfo.trigger,
      requirement: triggerInfo.requirement,
    });
  }

  return steps;
}

async function fetchEncounterEntriesForPokemon(
  pokemonNameOrId: string | number,
  versionId: string
): Promise<{ pokemonId: number; pokemonName: string; encounters: EncounterEntry[] }> {
  const pokemon = await pokedex.getPokemonByName(pokemonNameOrId as never);
  const locationUrl = pokemon.location_area_encounters;
  if (!locationUrl) {
    return { pokemonId: pokemon.id, pokemonName: titleCase(pokemon.name), encounters: [] };
  }

  const response = await fetch(locationUrl, { next: { revalidate: 3600 } });
  if (!response.ok) {
    return { pokemonId: pokemon.id, pokemonName: titleCase(pokemon.name), encounters: [] };
  }

  const payload = (await response.json()) as Array<{
    location_area: { name: string };
    version_details: Array<{
      version: { name: string };
      max_chance: number;
      encounter_details: Array<{
        min_level: number | null;
        max_level: number | null;
        chance: number | null;
        method: { name: string };
        condition_values: Array<{ name: string }>;
      }>;
    }>;
  }>;

  const entries: EncounterEntry[] = [];

  payload.forEach((areaRecord) => {
    const location = formatLocationName(areaRecord.location_area.name);

    areaRecord.version_details
      .filter((details) => details.version.name === versionId)
      .forEach((details) => {
        details.encounter_details.forEach((encounter) => {
          const chance =
            typeof encounter.chance === "number" && Number.isFinite(encounter.chance)
              ? encounter.chance
              : typeof details.max_chance === "number" && Number.isFinite(details.max_chance)
                ? details.max_chance
                : null;

          entries.push({
            location,
            method: formatMethodName(encounter.method.name),
            levelText: formatLevelText(encounter.min_level, encounter.max_level),
            chance,
            conditions: (encounter.condition_values ?? []).map((condition) =>
              formatConditionName(condition.name)
            ),
          });
        });
      });
  });

  const deduped = new Map<string, EncounterEntry>();
  entries.forEach((entry) => {
    const key = [
      entry.location,
      entry.method,
      entry.levelText ?? "",
      entry.chance ?? "",
      entry.conditions.join("|"),
    ].join("::");
    if (!deduped.has(key)) {
      deduped.set(key, entry);
    }
  });

  const sorted = Array.from(deduped.values()).sort((a, b) => {
    const chanceA = a.chance ?? -1;
    const chanceB = b.chance ?? -1;
    if (chanceA !== chanceB) return chanceB - chanceA;
    return a.location.localeCompare(b.location);
  });

  return {
    pokemonId: pokemon.id,
    pokemonName: titleCase(pokemon.name),
    encounters: sorted,
  };
}

async function resolveCaptureGuide(pokemonId: number, versionId: string): Promise<CaptureGuideResponse> {
  const targetPokemon = await pokedex.getPokemonByName(pokemonId as never);
  const targetSpecies = await pokedex.getPokemonSpeciesByName(targetPokemon.name as never);

  const lineage: string[] = [targetSpecies.name];
  let cursor = targetSpecies.evolves_from_species?.name ?? null;

  while (cursor) {
    lineage.push(cursor);
    const species = await pokedex.getPokemonSpeciesByName(cursor as never);
    cursor = species.evolves_from_species?.name ?? null;
  }

  let sourcePokemonName = targetPokemon.name;
  let sourceSpeciesName = targetSpecies.name;
  let sourcePokemonId = targetPokemon.id;
  let encounters: EncounterEntry[] = [];

  for (const speciesName of lineage) {
    const encounterResult = await fetchEncounterEntriesForPokemon(speciesName, versionId);
    if (encounterResult.encounters.length > 0) {
      sourcePokemonName = encounterResult.pokemonName;
      sourceSpeciesName = speciesName;
      sourcePokemonId = encounterResult.pokemonId;
      encounters = encounterResult.encounters;
      break;
    }
  }

  const targetName = titleCase(targetPokemon.name);
  const sourceName = titleCase(sourcePokemonName);
  const requiresEvolution = sourcePokemonId !== targetPokemon.id;

  const targetIndex = lineage.findIndex((name) => name === targetPokemon.name);
  const sourceIndex = lineage.findIndex((name) => name === sourceSpeciesName);
  const evolutionPath =
    sourceIndex >= 0 && targetIndex >= 0
      ? lineage
          .slice(targetIndex, sourceIndex + 1)
          .reverse()
          .map((name) => titleCase(name))
      : [sourceName, targetName].filter((value, index, array) => array.indexOf(value) === index);

  let evolutionSteps: CaptureGuideResponse["evolutionSteps"] = [];
  if (targetSpecies.evolution_chain?.url) {
    try {
      const chainResponse = await fetch(targetSpecies.evolution_chain.url, { next: { revalidate: 3600 } });
      if (chainResponse.ok) {
        const chainPayload = (await chainResponse.json()) as { chain?: Record<string, unknown> };
        const pathToTarget = findEvolutionPathToTarget(chainPayload.chain ?? null, targetSpecies.name);
        evolutionSteps = buildEvolutionSteps(pathToTarget, sourceSpeciesName, targetSpecies.name);
      }
    } catch {
      // ignore evolution chain errors and keep fallback notes.
    }
  }

  let note: string | null = null;
  if (encounters.length === 0) {
    note = `No encounter routes found in ${titleCase(versionId)}. This Pokémon may require trading, gifts, special events, or non-wild methods.`;
  } else if (requiresEvolution) {
    note = `${targetName} is not directly found in the wild here. Catch ${sourceName} first, then evolve.`;
    if (evolutionSteps.length === 0) {
      note += " Evolution method can vary by game conditions.";
    }
  }

  return {
    pokemonId: targetPokemon.id,
    pokemonName: targetName,
    sourcePokemonName: sourceName,
    sourcePokemonId,
    requiresEvolution,
    evolutionPath,
    evolutionSteps,
    encounters: encounters.slice(0, 6),
    note,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pokemonId = Number(searchParams.get("pokemonId"));
  const versionId = searchParams.get("versionId")?.trim().toLowerCase() ?? "";

  if (!Number.isInteger(pokemonId) || pokemonId <= 0) {
    return NextResponse.json({ error: "pokemonId must be a positive integer." }, { status: 400 });
  }

  if (!versionId) {
    return NextResponse.json({ error: "versionId is required." }, { status: 400 });
  }

  const cacheKey = `${pokemonId}:${versionId}`;
  const inFlight = requestCache.get(cacheKey);

  const requestPromise = inFlight ?? resolveCaptureGuide(pokemonId, versionId);

  if (!inFlight) {
    requestCache.set(cacheKey, requestPromise);
  }

  try {
    const payload = await requestPromise;
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load capture guide." }, { status: 500 });
  } finally {
    if (!inFlight) {
      requestCache.delete(cacheKey);
    }
  }
}
