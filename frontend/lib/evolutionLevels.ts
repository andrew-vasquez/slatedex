/**
 * Level at which each evolution occurs (level-up only).
 * Key: base species name (first in evolution line), lowercase.
 * Value: levels at which each evolution happens [stage1→2, stage2→3, ...].
 *
 * Used to determine max allowed evolution stage at a given checkpoint level.
 * Pokemon not in this map fall back to stage-based heuristics.
 */
export const EVOLUTION_LEVELS: Record<string, number[]> = {
  // Gen 1
  bulbasaur: [16, 32],
  charmander: [16, 36],
  squirtle: [16, 36],
  caterpie: [7, 10],
  weedle: [7, 10],
  pidgey: [18, 36],
  rattata: [20],
  spearow: [20],
  ekans: [22],
  pikachu: [18],
  sandshrew: [22],
  nidoranf: [16],
  nidoranm: [16],
  clefairy: [36],
  vulpix: [36],
  jigglypuff: [36],
  zubat: [22],
  oddish: [21],
  paras: [24],
  venonat: [31],
  diglett: [26],
  meowth: [28],
  psyduck: [33],
  mankey: [28],
  growlithe: [36],
  poliwag: [25],
  abra: [16],
  machop: [28],
  bellsprout: [21],
  tentacool: [30],
  geodude: [25],
  ponyta: [40],
  slowpoke: [37],
  magnemite: [30],
  farfetchd: [36],
  doduo: [31],
  seel: [34],
  grimer: [38],
  shellder: [36],
  gastly: [25],
  drowzee: [26],
  krabby: [28],
  voltorb: [30],
  exeggcute: [25],
  cubone: [28],
  lickitung: [33],
  koffing: [35],
  rhyhorn: [42],
  chansey: [36],
  tangela: [34],
  kangaskhan: [36],
  horsea: [32],
  goldeen: [33],
  staryu: [36],
  scyther: [30],
  magikarp: [20],
  eevee: [36],
  porygon: [36],
  omanyte: [40],
  kabuto: [40],
  dratini: [30, 55],

  // Gen 2
  chikorita: [16, 32],
  cyndaquil: [14, 36],
  totodile: [18, 30],
  sentret: [15],
  hoothoot: [20],
  ledyba: [18],
  spinarak: [22],
  chinchou: [27],
  togepi: [18],
  natu: [25],
  mareep: [15],
  marill: [18],
  sudowoodo: [36],
  hoppip: [18],
  aipom: [32],
  sunkern: [18],
  yanma: [33],
  wooper: [20],
  murkrow: [35],
  misdreavus: [30],
  unown: [],
  girafarig: [32],
  pineco: [31],
  dunsparce: [36],
  gligar: [36],
  snubbull: [23],
  qwilfish: [36],
  shuckle: [36],
  heracross: [36],
  sneasel: [36],
  teddiursa: [30],
  slugma: [38],
  swinub: [33],
  corsola: [36],
  remoraid: [25],
  delibird: [36],
  mantine: [36],
  skarmory: [36],
  houndour: [24],
  phanpy: [25],
  stantler: [31],
  tyrogue: [20],
  smoochum: [30],
  elekid: [30],
  magby: [30],
  miltank: [36],
  larvitar: [30, 55],

  // Gen 3
  treecko: [16, 36],
  torchic: [16, 36],
  mudkip: [16, 36],
  poochyena: [18],
  zigzagoon: [20],
  wurmple: [7],
  lotad: [14], // Lombre at 14; Ludicolo via Water Stone only (no level-up)
  seedot: [14], // Nuzleaf at 14; Shiftry via Leaf Stone only (no level-up)
  taillow: [22],
  wingull: [25],
  ralts: [20, 30], // Kirlia at 20, Gardevoir at 30
  surskit: [22],
  shroomish: [23],
  slakoth: [18],
  nincada: [20],
  whismur: [20],
  makuhita: [24],
  nosepass: [40],
  skitty: [18],
  sableye: [],
  mawile: [],
  aron: [32, 42],
  meditite: [37],
  electrike: [26],
  plusle: [36],
  minun: [36],
  volbeat: [36],
  illumise: [36],
  budew: [18],   // → Roselia (friendship); Roserade via Shiny Stone
  roselia: [36], // standalone in Gen 3; in Gen 4+ line is budew→roselia→roserade
  gulpin: [26],
  carvanha: [30],
  wailmer: [40],
  numel: [33],
  torkoal: [],
  spoink: [32],
  spinda: [],
  trapinch: [35],
  cacnea: [32],
  swablu: [35],
  zangoose: [36],
  seviper: [36],
  lunatone: [],
  solrock: [],
  barboach: [30],
  corphish: [30],
  baltoy: [36],
  lileep: [40],
  anorith: [40],
  feebas: [36],
  castform: [],
  kecleon: [],
  shuppet: [37],
  duskull: [37],
  tropius: [],
  chimecho: [36],
  absol: [],
  snorunt: [42],
  spheal: [32],
  clamperl: [36],
  relicanth: [],
  luvdisc: [],
  bagon: [30, 50],
  beldum: [20, 45],

  // Gen 4
  turtwig: [18, 32],
  chimchar: [14, 36],
  piplup: [16, 36],
  starly: [14],
  bidoof: [15],
  kricketot: [10],
  shinx: [15],
  cranidos: [30],
  shieldon: [30],
  burmy: [20],
  combee: [21],
  pachirisu: [36],
  buizel: [26],
  cherubi: [25],
  shellos: [30],
  drifloon: [28],
  buneary: [36],
  glameow: [38],
  stunky: [34],
  bronzor: [33],
  bonsly: [36],
  mimejr: [36],
  happiny: [36],
  chatot: [36],
  spiritomb: [],
  gible: [24, 48],
  munchlax: [36],
  riolu: [36],
  hippopotas: [34],
  skorupi: [40],
  croagunk: [37],
  carnivine: [],
  finneon: [31],
  mantyke: [36],
  snover: [40],
  rotom: [],
  phione: [],
  manaphy: [],

  // Gen 5
  snivy: [17, 36],
  tepig: [17, 36],
  oshawott: [17, 36],
  patrat: [20],
  lillipup: [16],
  purrloin: [20],
  pansage: [36],
  pansear: [36],
  panpour: [36],
  munna: [24],
  pidove: [21],
  roggenrola: [25],
  woobat: [20],
  drilbur: [31],
  audino: [36],
  timburr: [25],
  tympole: [25],
  sewaddle: [20],
  venipede: [30],
  cottonee: [36],
  petilil: [36],
  basculin: [],
  sandile: [29],
  darumaka: [35],
  maractus: [],
  dwebble: [34],
  scraggy: [39],
  sigilyph: [],
  yamask: [34],
  tirtouga: [37],
  archen: [37],
  trubbish: [36],
  zorua: [30],
  minccino: [36],
  gothita: [32],
  solosis: [32],
  ducklett: [35],
  vanillite: [35],
  deerling: [34],
  emolga: [36],
  karrablast: [36],
  foongus: [39],
  frillish: [40],
  alomomola: [36],
  joltik: [36],
  ferroseed: [40],
  klink: [38],
  tynamo: [39],
  elgyem: [42],
  litwick: [41],
  axew: [38],
  cubchoo: [37],
  cryogonal: [],
  shelmet: [36],
  stunfisk: [],
  mienfoo: [50],
  druddigon: [],
  golett: [43],
  pawniard: [52],
  bouffalant: [],
  rufflet: [54],
  vullaby: [54],
  heatmor: [],
  durant: [],
  deino: [50, 64],
  larvesta: [59],
};

/**
 * Get the max evolution stage allowed at a given level.
 * Returns 1 + number of evolution levels that are <= levelCap.
 * For Pokemon not in the map, returns null (caller should use fallback).
 * Uses conservative level (e.g. range min) so we don't assume player has max-level Pokemon.
 */
export function getMaxStageForLevel(
  baseSpeciesName: string,
  levelCap: number
): number | null {
  const levels = EVOLUTION_LEVELS[baseSpeciesName.toLowerCase()];
  if (!levels || levels.length === 0) return null;
  let count = 0;
  for (const lv of levels) {
    if (lv <= levelCap) count += 1;
    else break;
  }
  return 1 + count;
}

/** Level ranges per gym order (min, max). Matches presetRosters withLevels. */
export const GYM_LEVEL_RANGES: Record<number, { min: number; max: number }> = {
  1: { min: 12, max: 14 },
  2: { min: 18, max: 21 },
  3: { min: 22, max: 26 },
  4: { min: 28, max: 32 },
  5: { min: 31, max: 36 },
  6: { min: 35, max: 40 },
  7: { min: 40, max: 45 },
  8: { min: 43, max: 48 },
};

/**
 * Level cap to use for evolution stage checks per gym.
 * Gyms 1-4: use min (conservative — e.g. Aggron→Aron at gym 4).
 * Gyms 5-8: use max (player typically has higher-level team by then).
 */
export function getEvolutionLevelCapForGym(gymOrder: number): number {
  const range = GYM_LEVEL_RANGES[gymOrder];
  if (!range) return 30;
  return gymOrder <= 4 ? range.min : range.max;
}

// ── Stone evolutions ───────────────────────────────────────────────────────────

/** Stone types used for evolution (Gen 1–5). */
export type StoneType =
  | "water"
  | "leaf"
  | "fire"
  | "thunder"
  | "moon"
  | "sun"
  | "dawn"
  | "dusk"
  | "shiny";

/** Single stone or multiple (any one unlocks the evolution). */
export type StoneEvolutionEntry =
  | { stone: StoneType; preEvoStage: number }
  | { stones: StoneType[]; preEvoStage: number };

/**
 * Stone evolutions: base species -> stone(s) required for final form.
 * preEvoStage = stage that must be reachable by level before stone can be used.
 * Use `stones` when multiple stones lead to the same or equivalent final stage (e.g. Eevee).
 */
export const STONE_EVOLUTIONS: Record<string, StoneEvolutionEntry> = {
  // Gen 1
  pikachu: { stone: "thunder", preEvoStage: 1 },      // → Raichu
  nidoranf: { stone: "moon", preEvoStage: 2 },        // Nidorina → Nidoqueen
  nidoranm: { stone: "moon", preEvoStage: 2 },        // Nidorino → Nidoking
  clefairy: { stone: "moon", preEvoStage: 1 },        // → Clefable
  vulpix: { stone: "fire", preEvoStage: 1 },           // → Ninetales
  jigglypuff: { stone: "moon", preEvoStage: 1 },     // → Wigglytuff
  oddish: { stones: ["leaf", "sun"], preEvoStage: 2 }, // Gloom → Vileplume (Leaf) or Bellossom (Sun)
  growlithe: { stone: "fire", preEvoStage: 1 },       // → Arcanine
  poliwag: { stone: "water", preEvoStage: 2 },        // Poliwhirl → Poliwrath
  bellsprout: { stone: "leaf", preEvoStage: 2 },     // Weepinbell → Victreebel
  shellder: { stone: "water", preEvoStage: 1 },       // → Cloyster
  exeggcute: { stone: "leaf", preEvoStage: 1 },      // → Exeggutor
  staryu: { stone: "water", preEvoStage: 1 },        // → Starmie
  eevee: { stones: ["water", "thunder", "fire"], preEvoStage: 1 }, // → Vaporeon/Jolteon/Flareon

  // Gen 2
  togepi: { stone: "shiny", preEvoStage: 2 },       // Togetic → Togekiss (Gen 4)
  sunkern: { stone: "sun", preEvoStage: 1 },         // → Sunflora
  murkrow: { stone: "dusk", preEvoStage: 1 },        // → Honchkrow (Gen 4)
  misdreavus: { stone: "dusk", preEvoStage: 1 },    // → Mismagius (Gen 4)

  // Gen 3
  lotad: { stone: "water", preEvoStage: 2 },         // Lombre → Ludicolo
  seedot: { stone: "leaf", preEvoStage: 2 },         // Nuzleaf → Shiftry
  ralts: { stone: "dawn", preEvoStage: 2 },         // Kirlia (male) → Gallade (Gen 4)
  skitty: { stone: "moon", preEvoStage: 1 },         // → Delcatty
  snorunt: { stone: "dawn", preEvoStage: 1 },        // → Froslass (female, Gen 4)
  budew: { stone: "shiny", preEvoStage: 2 },       // Roselia → Roserade (Gen 4)

  // Gen 5
  pansage: { stone: "leaf", preEvoStage: 1 },        // → Simisage
  pansear: { stone: "fire", preEvoStage: 1 },        // → Simisear
  panpour: { stone: "water", preEvoStage: 1 },       // → Simipour
  munna: { stone: "moon", preEvoStage: 1 },         // → Musharna
  cottonee: { stone: "sun", preEvoStage: 1 },       // → Whimsicott
  petilil: { stone: "sun", preEvoStage: 1 },        // → Lilligant
  minccino: { stone: "shiny", preEvoStage: 1 },     // → Cinccino
  litwick: { stone: "dusk", preEvoStage: 2 },       // Lampent → Chandelure
  tynamo: { stone: "thunder", preEvoStage: 2 },     // Eelektrik → Eelektross
};

/**
 * Earliest gym order when each stone is first obtainable, per game.
 * Add entries as battle planner rolls out to each game.
 * gameId 1=RBY, 2=GSC, 3=RSE, 4=DPPt, 5=BW, 12=FRLG, 13=HGSS, etc.
 */
const STONE_AVAILABILITY: Record<number, Partial<Record<StoneType, number>>> = {
  3: {
    water: 7,   // Abandoned Ship (Surf + Dive); Dive from Mossdeep post-gym 7
    leaf: 5,    // Route 119 (before Fortree)
    fire: 5,    // Fiery Path (Route 112)
    thunder: 5, // New Mauville (Basement Key)
    moon: 6,    // Meteor Falls (Surf)
    sun: 7,     // Desert Underpass (Strength)
    dawn: 8,    // Mt. Coronet / Victory Road
    dusk: 8,
    shiny: 8,
  },
  // 1, 2, 4, 5, 12, 13: add when rolling out battle planner
};

/**
 * Earliest gym order when a stone is first available. Returns null if unknown or not in map.
 */
export function getStoneEarliestGym(gameId: number, stone: StoneType): number | null {
  const byGame = STONE_AVAILABILITY[gameId];
  if (!byGame) return null;
  const gym = byGame[stone];
  return gym ?? null;
}

function isStoneAvailableAtCheckpoint(
  gameId: number,
  stoneOrStones: StoneType | StoneType[],
  gymOrder: number
): boolean {
  const stones = Array.isArray(stoneOrStones) ? stoneOrStones : [stoneOrStones];
  for (const stone of stones) {
    const earliest = getStoneEarliestGym(gameId, stone);
    if (earliest !== null && gymOrder >= earliest) return true;
  }
  return false;
}

/**
 * Max evolution stage at a checkpoint, considering both level-up and stone evolutions.
 * For stone evos: allows final form only if (1) stone is available at checkpoint and
 * (2) pre-evolution stage is reachable by level.
 * Returns null if caller should use fallback (e.g. level-based or heuristic).
 */
export function getMaxStageForCheckpointWithStones(
  baseName: string,
  levelCap: number,
  gameId: number,
  gymOrder: number
): number | null {
  const base = baseName.toLowerCase();
  const levelBased = getMaxStageForLevel(base, levelCap);
  if (levelBased === null) return null;

  const stoneInfo = STONE_EVOLUTIONS[base];
  if (!stoneInfo) return levelBased;

  // Pre-evo must be reachable by level before stone can matter
  if (levelBased < stoneInfo.preEvoStage) return levelBased;

  const stoneOrStones = "stone" in stoneInfo ? stoneInfo.stone : stoneInfo.stones;
  if (!isStoneAvailableAtCheckpoint(gameId, stoneOrStones, gymOrder)) return levelBased;

  // Stone available: allow final form (preEvoStage + 1)
  return Math.max(levelBased, stoneInfo.preEvoStage + 1);
}
