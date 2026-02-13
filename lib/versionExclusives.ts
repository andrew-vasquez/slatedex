interface VersionExclusivityInput {
  gameId: number;
  speciesName: string;
  gameVersionIds: string[];
  gameIndexVersionIds?: string[];
}

interface VersionExclusivityResult {
  exclusiveStatus: "exclusive" | "shared" | "unknown";
  exclusiveToVersionIds: string[] | null;
}

type VersionSpeciesMap = Record<string, string[]>;

const RAW_CURATED_EXCLUSIVES: Record<number, VersionSpeciesMap> = {
  1: {
    red: [
      "ekans",
      "arbok",
      "oddish",
      "gloom",
      "vileplume",
      "mankey",
      "primeape",
      "growlithe",
      "arcanine",
      "scyther",
      "electabuzz",
    ],
    blue: [
      "sandshrew",
      "sandslash",
      "vulpix",
      "ninetales",
      "meowth",
      "persian",
      "bellsprout",
      "weepinbell",
      "victreebel",
      "magmar",
      "pinsir",
    ],
    // Treated conservatively so Yellow users are not over-filtered.
    yellow: [
      "ekans",
      "arbok",
      "oddish",
      "gloom",
      "vileplume",
      "mankey",
      "primeape",
      "growlithe",
      "arcanine",
      "scyther",
      "electabuzz",
      "sandshrew",
      "sandslash",
      "vulpix",
      "ninetales",
      "meowth",
      "persian",
      "bellsprout",
      "weepinbell",
      "victreebel",
      "magmar",
      "pinsir",
    ],
  },
  2: {
    gold: ["growlithe", "arcanine", "spinarak", "ariados", "gligar", "teddiursa", "ursaring", "mantine"],
    silver: ["vulpix", "ninetales", "ledyba", "ledian", "delibird", "skarmory", "phanpy", "donphan"],
    crystal: [
      "growlithe",
      "arcanine",
      "spinarak",
      "ariados",
      "gligar",
      "teddiursa",
      "ursaring",
      "mantine",
      "vulpix",
      "ninetales",
      "ledyba",
      "ledian",
      "delibird",
      "skarmory",
      "phanpy",
      "donphan",
    ],
  },
  3: {
    ruby: ["seedot", "nuzleaf", "shiftry", "mawile", "zangoose", "solrock", "groudon"],
    sapphire: ["lotad", "lombre", "ludicolo", "sableye", "seviper", "lunatone", "kyogre"],
    emerald: [
      "seedot",
      "nuzleaf",
      "shiftry",
      "mawile",
      "zangoose",
      "solrock",
      "lotad",
      "lombre",
      "ludicolo",
      "sableye",
      "seviper",
      "lunatone",
      "groudon",
      "kyogre",
    ],
  },
  4: {
    diamond: [
      "caterpie",
      "metapod",
      "butterfree",
      "ekans",
      "arbok",
      "growlithe",
      "arcanine",
      "seel",
      "dewgong",
      "scyther",
      "scizor",
      "murkrow",
      "honchkrow",
      "gligar",
      "gliscor",
      "kecleon",
      "cranidos",
      "rampardos",
      "stunky",
      "skuntank",
      "dialga",
    ],
    pearl: [
      "weedle",
      "kakuna",
      "beedrill",
      "sandshrew",
      "sandslash",
      "vulpix",
      "ninetales",
      "slowpoke",
      "slowbro",
      "slowking",
      "pinsir",
      "misdreavus",
      "mismagius",
      "bagon",
      "shelgon",
      "salamence",
      "shieldon",
      "bastiodon",
      "glameow",
      "purugly",
      "palkia",
    ],
    platinum: [
      "caterpie",
      "metapod",
      "butterfree",
      "ekans",
      "arbok",
      "growlithe",
      "arcanine",
      "seel",
      "dewgong",
      "scyther",
      "scizor",
      "murkrow",
      "honchkrow",
      "gligar",
      "gliscor",
      "kecleon",
      "cranidos",
      "rampardos",
      "stunky",
      "skuntank",
      "weedle",
      "kakuna",
      "beedrill",
      "sandshrew",
      "sandslash",
      "vulpix",
      "ninetales",
      "slowpoke",
      "slowbro",
      "slowking",
      "pinsir",
      "misdreavus",
      "mismagius",
      "bagon",
      "shelgon",
      "salamence",
      "shieldon",
      "bastiodon",
      "glameow",
      "purugly",
      "dialga",
      "palkia",
    ],
  },
  5: {
    black: [
      "cottonee",
      "whimsicott",
      "scraggy",
      "scrafty",
      "gothita",
      "gothorita",
      "gothitelle",
      "rufflet",
      "braviary",
      "tornadus",
      "reshiram",
    ],
    white: [
      "petilil",
      "lilligant",
      "croagunk",
      "toxicroak",
      "solosis",
      "duosion",
      "reuniclus",
      "vullaby",
      "mandibuzz",
      "thundurus",
      "zekrom",
    ],
  },
};

function normalizeId(value: string): string {
  return value.trim().toLowerCase();
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function buildCuratedAvailabilityMap(versionSpeciesMap: VersionSpeciesMap): Record<string, string[]> {
  const speciesToVersions: Record<string, string[]> = {};

  for (const [versionId, speciesList] of Object.entries(versionSpeciesMap)) {
    const normalizedVersionId = normalizeId(versionId);
    for (const species of speciesList) {
      const normalizedSpecies = normalizeId(species);
      if (!speciesToVersions[normalizedSpecies]) {
        speciesToVersions[normalizedSpecies] = [];
      }
      speciesToVersions[normalizedSpecies].push(normalizedVersionId);
    }
  }

  for (const species of Object.keys(speciesToVersions)) {
    speciesToVersions[species] = unique(speciesToVersions[species]);
  }

  return speciesToVersions;
}

const CURATED_AVAILABILITY_BY_GAME: Record<number, Record<string, string[]>> = Object.fromEntries(
  Object.entries(RAW_CURATED_EXCLUSIVES).map(([gameId, versionSpeciesMap]) => [
    Number(gameId),
    buildCuratedAvailabilityMap(versionSpeciesMap),
  ])
);

function classifyAvailability(availableVersionIds: string[], gameVersionIds: string[]): VersionExclusivityResult {
  const normalizedAvailable = unique(availableVersionIds.map(normalizeId)).filter((id) =>
    gameVersionIds.includes(id)
  );

  if (normalizedAvailable.length === 0) {
    return { exclusiveStatus: "unknown", exclusiveToVersionIds: null };
  }

  if (normalizedAvailable.length >= gameVersionIds.length) {
    return { exclusiveStatus: "shared", exclusiveToVersionIds: null };
  }

  return {
    exclusiveStatus: "exclusive",
    exclusiveToVersionIds: normalizedAvailable,
  };
}

export function resolveVersionExclusivity({
  gameId,
  speciesName,
  gameVersionIds,
  gameIndexVersionIds = [],
}: VersionExclusivityInput): VersionExclusivityResult {
  const normalizedVersionIds = unique(gameVersionIds.map(normalizeId));
  const normalizedSpecies = normalizeId(speciesName);

  if (normalizedVersionIds.length <= 1) {
    return { exclusiveStatus: "shared", exclusiveToVersionIds: null };
  }

  const curatedAvailability = CURATED_AVAILABILITY_BY_GAME[gameId]?.[normalizedSpecies];
  if (curatedAvailability && curatedAvailability.length > 0) {
    return classifyAvailability(curatedAvailability, normalizedVersionIds);
  }

  // Hybrid fallback: infer limited signal from API game index data.
  const derivedAvailability = unique(gameIndexVersionIds.map(normalizeId)).filter((id) =>
    normalizedVersionIds.includes(id)
  );

  if (derivedAvailability.length === normalizedVersionIds.length) {
    return { exclusiveStatus: "shared", exclusiveToVersionIds: null };
  }

  if (derivedAvailability.length === 1) {
    return {
      exclusiveStatus: "exclusive",
      exclusiveToVersionIds: derivedAvailability,
    };
  }

  return { exclusiveStatus: "unknown", exclusiveToVersionIds: null };
}
