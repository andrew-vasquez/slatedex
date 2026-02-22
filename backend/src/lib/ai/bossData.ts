import type { BossGuideEntry } from "./types";

const GROUP_BOSSES: Record<string, BossGuideEntry[]> = {
  kanto_classic: [
    { name: "Brock", stage: "gym", primaryTypes: ["rock", "ground"] },
    { name: "Misty", stage: "gym", primaryTypes: ["water"] },
    { name: "Lt. Surge", stage: "gym", primaryTypes: ["electric"] },
    { name: "Erika", stage: "gym", primaryTypes: ["grass", "poison"] },
    { name: "Koga", stage: "gym", primaryTypes: ["poison"] },
    { name: "Sabrina", stage: "gym", primaryTypes: ["psychic"] },
    { name: "Blaine", stage: "gym", primaryTypes: ["fire"] },
    { name: "Giovanni", stage: "gym", primaryTypes: ["ground", "rock"] },
    { name: "Lorelei", stage: "elite4", primaryTypes: ["ice", "water"] },
    { name: "Bruno", stage: "elite4", primaryTypes: ["fighting", "rock"] },
    { name: "Agatha", stage: "elite4", primaryTypes: ["ghost", "poison"] },
    { name: "Lance", stage: "elite4", primaryTypes: ["dragon", "flying"] },
    { name: "Champion Blue", stage: "champion", primaryTypes: ["mixed"], notes: "Flexible roster coverage." },
  ],
  johto_classic: [
    { name: "Falkner", stage: "gym", primaryTypes: ["flying", "normal"] },
    { name: "Bugsy", stage: "gym", primaryTypes: ["bug"] },
    { name: "Whitney", stage: "gym", primaryTypes: ["normal"] },
    { name: "Morty", stage: "gym", primaryTypes: ["ghost"] },
    { name: "Chuck", stage: "gym", primaryTypes: ["fighting"] },
    { name: "Jasmine", stage: "gym", primaryTypes: ["steel"] },
    { name: "Pryce", stage: "gym", primaryTypes: ["ice"] },
    { name: "Clair", stage: "gym", primaryTypes: ["dragon"] },
    { name: "Will", stage: "elite4", primaryTypes: ["psychic"] },
    { name: "Koga", stage: "elite4", primaryTypes: ["poison", "bug"] },
    { name: "Bruno", stage: "elite4", primaryTypes: ["fighting", "rock"] },
    { name: "Karen", stage: "elite4", primaryTypes: ["dark", "poison"] },
    { name: "Champion Lance", stage: "champion", primaryTypes: ["dragon", "flying"] },
  ],
  hoenn_classic: [
    { name: "Roxanne", stage: "gym", primaryTypes: ["rock"] },
    { name: "Brawly", stage: "gym", primaryTypes: ["fighting"] },
    { name: "Wattson", stage: "gym", primaryTypes: ["electric"] },
    { name: "Flannery", stage: "gym", primaryTypes: ["fire"] },
    { name: "Norman", stage: "gym", primaryTypes: ["normal"] },
    { name: "Winona", stage: "gym", primaryTypes: ["flying"] },
    { name: "Tate & Liza", stage: "gym", primaryTypes: ["psychic"] },
    { name: "Juan/Wallace", stage: "gym", primaryTypes: ["water"] },
    { name: "Sidney", stage: "elite4", primaryTypes: ["dark"] },
    { name: "Phoebe", stage: "elite4", primaryTypes: ["ghost"] },
    { name: "Glacia", stage: "elite4", primaryTypes: ["ice"] },
    { name: "Drake", stage: "elite4", primaryTypes: ["dragon"] },
    { name: "Champion Wallace", stage: "champion", primaryTypes: ["water"] },
  ],
  hoenn_oras: [
    { name: "Roxanne", stage: "gym", primaryTypes: ["rock"] },
    { name: "Brawly", stage: "gym", primaryTypes: ["fighting"] },
    { name: "Wattson", stage: "gym", primaryTypes: ["electric"] },
    { name: "Flannery", stage: "gym", primaryTypes: ["fire"] },
    { name: "Norman", stage: "gym", primaryTypes: ["normal"] },
    { name: "Winona", stage: "gym", primaryTypes: ["flying"] },
    { name: "Tate & Liza", stage: "gym", primaryTypes: ["psychic"] },
    { name: "Wallace", stage: "gym", primaryTypes: ["water"] },
    { name: "Sidney", stage: "elite4", primaryTypes: ["dark"] },
    { name: "Phoebe", stage: "elite4", primaryTypes: ["ghost"] },
    { name: "Glacia", stage: "elite4", primaryTypes: ["ice"] },
    { name: "Drake", stage: "elite4", primaryTypes: ["dragon"] },
    { name: "Champion Steven", stage: "champion", primaryTypes: ["steel", "rock"] },
  ],
  kanto_frlg: [
    { name: "Brock", stage: "gym", primaryTypes: ["rock", "ground"] },
    { name: "Misty", stage: "gym", primaryTypes: ["water"] },
    { name: "Lt. Surge", stage: "gym", primaryTypes: ["electric"] },
    { name: "Erika", stage: "gym", primaryTypes: ["grass", "poison"] },
    { name: "Koga", stage: "gym", primaryTypes: ["poison"] },
    { name: "Sabrina", stage: "gym", primaryTypes: ["psychic"] },
    { name: "Blaine", stage: "gym", primaryTypes: ["fire"] },
    { name: "Giovanni", stage: "gym", primaryTypes: ["ground"] },
    { name: "Lorelei", stage: "elite4", primaryTypes: ["ice", "water"] },
    { name: "Bruno", stage: "elite4", primaryTypes: ["fighting", "rock"] },
    { name: "Agatha", stage: "elite4", primaryTypes: ["ghost", "poison"] },
    { name: "Lance", stage: "elite4", primaryTypes: ["dragon", "flying"] },
    { name: "Champion Blue", stage: "champion", primaryTypes: ["mixed"] },
  ],
  sinnoh_classic: [
    { name: "Roark", stage: "gym", primaryTypes: ["rock"] },
    { name: "Gardenia", stage: "gym", primaryTypes: ["grass"] },
    { name: "Maylene", stage: "gym", primaryTypes: ["fighting"] },
    { name: "Crasher Wake", stage: "gym", primaryTypes: ["water"] },
    { name: "Fantina", stage: "gym", primaryTypes: ["ghost"] },
    { name: "Byron", stage: "gym", primaryTypes: ["steel"] },
    { name: "Candice", stage: "gym", primaryTypes: ["ice"] },
    { name: "Volkner", stage: "gym", primaryTypes: ["electric"] },
    { name: "Aaron", stage: "elite4", primaryTypes: ["bug"] },
    { name: "Bertha", stage: "elite4", primaryTypes: ["ground"] },
    { name: "Flint", stage: "elite4", primaryTypes: ["fire"] },
    { name: "Lucian", stage: "elite4", primaryTypes: ["psychic"] },
    { name: "Champion Cynthia", stage: "champion", primaryTypes: ["mixed"], notes: "High coverage and strong ace threats." },
  ],
  johto_hgss: [
    { name: "Falkner", stage: "gym", primaryTypes: ["flying", "normal"] },
    { name: "Bugsy", stage: "gym", primaryTypes: ["bug"] },
    { name: "Whitney", stage: "gym", primaryTypes: ["normal"] },
    { name: "Morty", stage: "gym", primaryTypes: ["ghost"] },
    { name: "Chuck", stage: "gym", primaryTypes: ["fighting"] },
    { name: "Jasmine", stage: "gym", primaryTypes: ["steel"] },
    { name: "Pryce", stage: "gym", primaryTypes: ["ice"] },
    { name: "Clair", stage: "gym", primaryTypes: ["dragon"] },
    { name: "Will", stage: "elite4", primaryTypes: ["psychic"] },
    { name: "Koga", stage: "elite4", primaryTypes: ["poison"] },
    { name: "Bruno", stage: "elite4", primaryTypes: ["fighting", "rock"] },
    { name: "Karen", stage: "elite4", primaryTypes: ["dark"] },
    { name: "Champion Lance", stage: "champion", primaryTypes: ["dragon", "flying"] },
  ],
  unova_bw: [
    { name: "Cilan/Chili/Cress", stage: "gym", primaryTypes: ["grass", "fire", "water"] },
    { name: "Lenora", stage: "gym", primaryTypes: ["normal"] },
    { name: "Burgh", stage: "gym", primaryTypes: ["bug"] },
    { name: "Elesa", stage: "gym", primaryTypes: ["electric"] },
    { name: "Clay", stage: "gym", primaryTypes: ["ground"] },
    { name: "Skyla", stage: "gym", primaryTypes: ["flying"] },
    { name: "Brycen", stage: "gym", primaryTypes: ["ice"] },
    { name: "Drayden/Iris", stage: "gym", primaryTypes: ["dragon"] },
    { name: "Shauntal", stage: "elite4", primaryTypes: ["ghost"] },
    { name: "Grimsley", stage: "elite4", primaryTypes: ["dark"] },
    { name: "Caitlin", stage: "elite4", primaryTypes: ["psychic"] },
    { name: "Marshal", stage: "elite4", primaryTypes: ["fighting"] },
    { name: "N & Ghetsis", stage: "champion", primaryTypes: ["mixed"], notes: "Finale battles with broad coverage." },
  ],
  kalos_xy: [
    { name: "Viola", stage: "gym", primaryTypes: ["bug"] },
    { name: "Grant", stage: "gym", primaryTypes: ["rock"] },
    { name: "Korrina", stage: "gym", primaryTypes: ["fighting"] },
    { name: "Ramos", stage: "gym", primaryTypes: ["grass"] },
    { name: "Clemont", stage: "gym", primaryTypes: ["electric"] },
    { name: "Valerie", stage: "gym", primaryTypes: ["fairy"] },
    { name: "Olympia", stage: "gym", primaryTypes: ["psychic"] },
    { name: "Wulfric", stage: "gym", primaryTypes: ["ice"] },
    { name: "Malva", stage: "elite4", primaryTypes: ["fire"] },
    { name: "Siebold", stage: "elite4", primaryTypes: ["water"] },
    { name: "Wikstrom", stage: "elite4", primaryTypes: ["steel"] },
    { name: "Drasna", stage: "elite4", primaryTypes: ["dragon"] },
    { name: "Champion Diantha", stage: "champion", primaryTypes: ["mixed"] },
  ],
  alola_sm: [
    { name: "Kahuna Hala", stage: "gym", primaryTypes: ["fighting"] },
    { name: "Kahuna Olivia", stage: "gym", primaryTypes: ["rock"] },
    { name: "Kahuna Nanu", stage: "gym", primaryTypes: ["dark"] },
    { name: "Kahuna Hapu", stage: "gym", primaryTypes: ["ground"] },
    { name: "Molayne", stage: "elite4", primaryTypes: ["steel"] },
    { name: "Olivia", stage: "elite4", primaryTypes: ["rock"] },
    { name: "Acerola", stage: "elite4", primaryTypes: ["ghost"] },
    { name: "Kahili", stage: "elite4", primaryTypes: ["flying"] },
    { name: "Professor Kukui", stage: "champion", primaryTypes: ["mixed"] },
  ],
  alola_usum: [
    { name: "Kahuna Hala", stage: "gym", primaryTypes: ["fighting"] },
    { name: "Kahuna Olivia", stage: "gym", primaryTypes: ["rock"] },
    { name: "Kahuna Nanu", stage: "gym", primaryTypes: ["dark"] },
    { name: "Kahuna Hapu", stage: "gym", primaryTypes: ["ground"] },
    { name: "Molayne", stage: "elite4", primaryTypes: ["steel"] },
    { name: "Olivia", stage: "elite4", primaryTypes: ["rock"] },
    { name: "Acerola", stage: "elite4", primaryTypes: ["ghost"] },
    { name: "Kahili", stage: "elite4", primaryTypes: ["flying"] },
    { name: "Champion Hau", stage: "champion", primaryTypes: ["mixed"] },
  ],
  kanto_lgpe: [
    { name: "Brock", stage: "gym", primaryTypes: ["rock", "ground"] },
    { name: "Misty", stage: "gym", primaryTypes: ["water"] },
    { name: "Lt. Surge", stage: "gym", primaryTypes: ["electric"] },
    { name: "Erika", stage: "gym", primaryTypes: ["grass"] },
    { name: "Koga", stage: "gym", primaryTypes: ["poison"] },
    { name: "Sabrina", stage: "gym", primaryTypes: ["psychic"] },
    { name: "Blaine", stage: "gym", primaryTypes: ["fire"] },
    { name: "Giovanni", stage: "gym", primaryTypes: ["ground"] },
    { name: "Lorelei", stage: "elite4", primaryTypes: ["ice", "water"] },
    { name: "Bruno", stage: "elite4", primaryTypes: ["fighting", "rock"] },
    { name: "Agatha", stage: "elite4", primaryTypes: ["ghost", "poison"] },
    { name: "Lance", stage: "elite4", primaryTypes: ["dragon", "flying"] },
    { name: "Champion Trace", stage: "champion", primaryTypes: ["mixed"] },
  ],
  galar_swsh: [
    { name: "Milo", stage: "gym", primaryTypes: ["grass"] },
    { name: "Nessa", stage: "gym", primaryTypes: ["water"] },
    { name: "Kabu", stage: "gym", primaryTypes: ["fire"] },
    { name: "Bea/Allister", stage: "gym", primaryTypes: ["fighting", "ghost"] },
    { name: "Opal", stage: "gym", primaryTypes: ["fairy"] },
    { name: "Gordie/Melony", stage: "gym", primaryTypes: ["rock", "ice"] },
    { name: "Piers", stage: "gym", primaryTypes: ["dark"] },
    { name: "Raihan", stage: "gym", primaryTypes: ["dragon"] },
    { name: "Marnie", stage: "elite4", primaryTypes: ["dark", "mixed"] },
    { name: "Hop", stage: "elite4", primaryTypes: ["mixed"] },
    { name: "Bede", stage: "elite4", primaryTypes: ["fairy", "psychic"] },
    { name: "Champion Leon", stage: "champion", primaryTypes: ["mixed"], notes: "Very high offensive pressure." },
  ],
  paldea_sv: [
    { name: "Katy", stage: "gym", primaryTypes: ["bug"] },
    { name: "Brassius", stage: "gym", primaryTypes: ["grass"] },
    { name: "Iono", stage: "gym", primaryTypes: ["electric"] },
    { name: "Kofu", stage: "gym", primaryTypes: ["water"] },
    { name: "Larry", stage: "gym", primaryTypes: ["normal"] },
    { name: "Ryme", stage: "gym", primaryTypes: ["ghost"] },
    { name: "Tulip", stage: "gym", primaryTypes: ["psychic"] },
    { name: "Grusha", stage: "gym", primaryTypes: ["ice"] },
    { name: "Rika", stage: "elite4", primaryTypes: ["ground"] },
    { name: "Poppy", stage: "elite4", primaryTypes: ["steel"] },
    { name: "Larry (Elite)", stage: "elite4", primaryTypes: ["flying"] },
    { name: "Hassel", stage: "elite4", primaryTypes: ["dragon"] },
    { name: "Champion Geeta", stage: "champion", primaryTypes: ["mixed"] },
  ],
};

const VERSION_TO_GROUP: Record<string, keyof typeof GROUP_BOSSES> = {
  red: "kanto_classic",
  blue: "kanto_classic",
  yellow: "kanto_classic",
  gold: "johto_classic",
  silver: "johto_classic",
  crystal: "johto_classic",
  ruby: "hoenn_classic",
  sapphire: "hoenn_classic",
  emerald: "hoenn_classic",
  firered: "kanto_frlg",
  leafgreen: "kanto_frlg",
  diamond: "sinnoh_classic",
  pearl: "sinnoh_classic",
  platinum: "sinnoh_classic",
  heartgold: "johto_hgss",
  soulsilver: "johto_hgss",
  black: "unova_bw",
  white: "unova_bw",
  x: "kalos_xy",
  y: "kalos_xy",
  "omega-ruby": "hoenn_oras",
  "alpha-sapphire": "hoenn_oras",
  sun: "alola_sm",
  moon: "alola_sm",
  "ultra-sun": "alola_usum",
  "ultra-moon": "alola_usum",
  "lets-go-pikachu": "kanto_lgpe",
  "lets-go-eevee": "kanto_lgpe",
  sword: "galar_swsh",
  shield: "galar_swsh",
  scarlet: "paldea_sv",
  violet: "paldea_sv",
};

function normalizeVersionId(value: string | null | undefined): string {
  if (!value) return "";
  return value.trim().toLowerCase().replace(/[_\s]+/g, "-");
}

const GYM_1_EVOLUTION_BAND =
  "Gym 1 pacing: use base forms and a few first evolutions only. Treat final evolutions as unrealistic at this checkpoint.";
const GYM_2_EVOLUTION_BAND =
  "Gym 2 pacing: mostly base or first-evolution Pokemon; starter is usually first evolution around Lv16. Avoid final evolutions.";
const MID_GYM_EVOLUTION_BAND =
  "Mid gym pacing (Gyms 3-5): mostly first/second evolutions, with occasional final evolutions from fast-level lines.";
const LATE_GYM_EVOLUTION_BAND =
  "Late gym pacing (Gyms 6-8): final evolutions become common and should be treated as realistic.";
const ELITE_FOUR_EVOLUTION_BAND =
  "Elite Four pacing: expect mostly final evolutions and optimized movesets.";
const CHAMPION_EVOLUTION_BAND =
  "Champion pacing: expect full final-evolution rosters and broad coverage.";

function getGymCheckpointLevelRange(gymOrder: number): string {
  if (gymOrder <= 1) return "Lv 8-16";
  if (gymOrder === 2) return "Lv 16-24";
  if (gymOrder === 3) return "Lv 24-30";
  if (gymOrder === 4) return "Lv 30-36";
  if (gymOrder === 5) return "Lv 36-42";
  if (gymOrder === 6) return "Lv 42-48";
  if (gymOrder === 7) return "Lv 48-54";
  return "Lv 52-58";
}

function enrichBossGuidance(entries: BossGuideEntry[]): BossGuideEntry[] {
  let gymOrder = 0;

  return entries.map((entry) => {
    if (entry.stage === "gym") {
      gymOrder += 1;
      if (gymOrder <= 1) {
        return {
          ...entry,
          gymOrder,
          recommendedPlayerLevelRange: getGymCheckpointLevelRange(gymOrder),
          expectedEvolutionBand: GYM_1_EVOLUTION_BAND,
          notes:
            entry.notes ??
            "Use early-route catches and starter base/first-stage forms. Do not assume final-stage evolution availability.",
        };
      }
      if (gymOrder <= 2) {
        return {
          ...entry,
          gymOrder,
          recommendedPlayerLevelRange: getGymCheckpointLevelRange(gymOrder),
          expectedEvolutionBand: GYM_2_EVOLUTION_BAND,
          notes:
            entry.notes ??
            "Keep capture suggestions in early-game encounter windows and avoid late-game evolution assumptions.",
        };
      }

      if (gymOrder <= 5) {
        return {
          ...entry,
          gymOrder,
          recommendedPlayerLevelRange: getGymCheckpointLevelRange(gymOrder),
          expectedEvolutionBand: MID_GYM_EVOLUTION_BAND,
        };
      }

      return {
        ...entry,
        gymOrder,
        recommendedPlayerLevelRange: getGymCheckpointLevelRange(gymOrder),
        expectedEvolutionBand: LATE_GYM_EVOLUTION_BAND,
      };
    }

    if (entry.stage === "elite4") {
      return {
        ...entry,
        recommendedPlayerLevelRange: "Lv 50-65",
        expectedEvolutionBand: ELITE_FOUR_EVOLUTION_BAND,
      };
    }

    return {
      ...entry,
      recommendedPlayerLevelRange: "Lv 58-70",
      expectedEvolutionBand: CHAMPION_EVOLUTION_BAND,
    };
  });
}

export function getBossGuidanceForVersion(versionId: string | null | undefined): BossGuideEntry[] {
  const normalized = normalizeVersionId(versionId);
  if (!normalized) return [];
  const key = VERSION_TO_GROUP[normalized];
  if (!key) return [];
  return enrichBossGuidance(GROUP_BOSSES[key]);
}
