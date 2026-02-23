/**
 * Curated boss rosters for supported games (Gen 1–5).
 * Species IDs only — no moves/items/abilities in v1.
 *
 * Rules:
 * - Main-story canonical battle only (pre-postgame).
 * - Canonical version used when team differs between paired versions.
 * - Elite Four/Champion use final main-story teams.
 * - gameId matches frontend pokemon.ts (1=RBY, 2=GSC, 3=RSE, 4=D/P/P, 5=BW, 12=FRLG, 13=HGSS).
 */

export type BossStage = "gym" | "elite4" | "champion";

export interface BossEntry {
  key: string;
  name: string;
  stage: BossStage;
  gymOrder?: number; // 1-8 for gyms
  versionIds: string[]; // which versions this entry applies to
  rosterPokemonIds: number[]; // national dex IDs
  rosterLevels?: number[]; // per-slot expected level map
}

export interface GameBossData {
  gameId: number;
  generation: number;
  versionIds: string[];
  bosses: BossEntry[];
}

// ── Gen 1: Red / Blue / Yellow ────────────────────────────────────────────────

const RBY_BOSSES: BossEntry[] = [
  // Gyms (same across R/B/Y)
  {
    key: "kanto-rby-gym1-brock",
    name: "Brock",
    stage: "gym",
    gymOrder: 1,
    versionIds: ["red", "blue", "yellow"],
    rosterPokemonIds: [74, 95], // Geodude, Onix
  },
  {
    key: "kanto-rby-gym2-misty",
    name: "Misty",
    stage: "gym",
    gymOrder: 2,
    versionIds: ["red", "blue", "yellow"],
    rosterPokemonIds: [120, 121], // Staryu, Starmie
  },
  {
    key: "kanto-rby-gym3-lt-surge",
    name: "Lt. Surge",
    stage: "gym",
    gymOrder: 3,
    versionIds: ["red", "blue", "yellow"],
    rosterPokemonIds: [100, 25, 26], // Voltorb, Pikachu, Raichu
  },
  {
    key: "kanto-rby-gym4-erika",
    name: "Erika",
    stage: "gym",
    gymOrder: 4,
    versionIds: ["red", "blue", "yellow"],
    rosterPokemonIds: [114, 71, 45], // Tangela, Victreebel, Vileplume
  },
  {
    key: "kanto-rby-gym5-koga",
    name: "Koga",
    stage: "gym",
    gymOrder: 5,
    versionIds: ["red", "blue", "yellow"],
    rosterPokemonIds: [109, 109, 89, 110], // Koffing, Koffing, Muk, Weezing
  },
  {
    key: "kanto-rby-gym6-sabrina",
    name: "Sabrina",
    stage: "gym",
    gymOrder: 6,
    versionIds: ["red", "blue", "yellow"],
    rosterPokemonIds: [122, 64, 49, 65], // Mr. Mime, Kadabra, Venomoth, Alakazam
  },
  {
    key: "kanto-rby-gym7-blaine",
    name: "Blaine",
    stage: "gym",
    gymOrder: 7,
    versionIds: ["red", "blue", "yellow"],
    rosterPokemonIds: [77, 58, 78, 146], // Ponyta, Growlithe, Rapidash, Arcanine
  },
  {
    key: "kanto-rby-gym8-giovanni",
    name: "Giovanni",
    stage: "gym",
    gymOrder: 8,
    versionIds: ["red", "blue", "yellow"],
    rosterPokemonIds: [51, 31, 34, 111, 112], // Dugtrio, Nidoqueen, Nidoking, Rhyhorn, Rhydon
  },
  // Elite Four
  {
    key: "kanto-rby-e4-lorelei",
    name: "Lorelei",
    stage: "elite4",
    versionIds: ["red", "blue", "yellow"],
    rosterPokemonIds: [87, 91, 80, 124, 131], // Dewgong, Cloyster, Slowbro, Jynx, Lapras
  },
  {
    key: "kanto-rby-e4-bruno",
    name: "Bruno",
    stage: "elite4",
    versionIds: ["red", "blue", "yellow"],
    rosterPokemonIds: [95, 95, 107, 106, 68], // Onix, Onix, Hitmonchan, Hitmonlee, Machamp
  },
  {
    key: "kanto-rby-e4-agatha",
    name: "Agatha",
    stage: "elite4",
    versionIds: ["red", "blue", "yellow"],
    rosterPokemonIds: [94, 42, 93, 24, 94], // Gengar, Golbat, Haunter, Arbok, Gengar
  },
  {
    key: "kanto-rby-e4-lance",
    name: "Lance",
    stage: "elite4",
    versionIds: ["red", "blue", "yellow"],
    rosterPokemonIds: [148, 148, 142, 130, 149], // Dragonair, Dragonair, Aerodactyl, Gyarados, Dragonite
  },
  // Champion
  {
    key: "kanto-rby-champion-blue",
    name: "Blue",
    stage: "champion",
    versionIds: ["red", "blue", "yellow"],
    rosterPokemonIds: [18, 65, 112, 130, 59, 6], // Pidgeot, Alakazam, Rhydon, Gyarados, Arcanine, Charizard
  },
];

// ── Gen 1: FireRed / LeafGreen ───────────────────────────────────────────────

const FRLG_BOSSES: BossEntry[] = [
  // Gyms
  {
    key: "kanto-gym1-brock",
    name: "Brock",
    stage: "gym",
    gymOrder: 1,
    versionIds: ["firered", "leafgreen"],
    rosterPokemonIds: [74, 95], // Geodude, Onix
  },
  {
    key: "kanto-gym2-misty",
    name: "Misty",
    stage: "gym",
    gymOrder: 2,
    versionIds: ["firered", "leafgreen"],
    rosterPokemonIds: [120, 121], // Staryu, Starmie
  },
  {
    key: "kanto-gym3-lt-surge",
    name: "Lt. Surge",
    stage: "gym",
    gymOrder: 3,
    versionIds: ["firered", "leafgreen"],
    rosterPokemonIds: [100, 25, 26], // Voltorb, Pikachu, Raichu
  },
  {
    key: "kanto-gym4-erika",
    name: "Erika",
    stage: "gym",
    gymOrder: 4,
    versionIds: ["firered", "leafgreen"],
    rosterPokemonIds: [71, 114, 45], // Victreebel, Tangela, Vileplume
  },
  {
    key: "kanto-gym5-koga",
    name: "Koga",
    stage: "gym",
    gymOrder: 5,
    versionIds: ["firered", "leafgreen"],
    rosterPokemonIds: [109, 89, 109, 110], // Koffing, Muk, Koffing, Weezing
  },
  {
    key: "kanto-gym6-sabrina",
    name: "Sabrina",
    stage: "gym",
    gymOrder: 6,
    versionIds: ["firered", "leafgreen"],
    rosterPokemonIds: [64, 122, 49, 65], // Kadabra, Mr. Mime, Venomoth, Alakazam
  },
  {
    key: "kanto-gym7-blaine",
    name: "Blaine",
    stage: "gym",
    gymOrder: 7,
    versionIds: ["firered", "leafgreen"],
    rosterPokemonIds: [58, 77, 78, 146], // Growlithe, Ponyta, Rapidash, Arcanine
  },
  {
    key: "kanto-gym8-giovanni",
    name: "Giovanni",
    stage: "gym",
    gymOrder: 8,
    versionIds: ["firered", "leafgreen"],
    rosterPokemonIds: [111, 51, 31, 34, 112], // Rhyhorn, Dugtrio, Nidoqueen, Nidoking, Rhydon
  },
  // Elite Four
  {
    key: "kanto-e4-lorelei",
    name: "Lorelei",
    stage: "elite4",
    versionIds: ["firered", "leafgreen"],
    rosterPokemonIds: [87, 91, 80, 124, 131], // Dewgong, Cloyster, Slowbro, Jynx, Lapras
  },
  {
    key: "kanto-e4-bruno",
    name: "Bruno",
    stage: "elite4",
    versionIds: ["firered", "leafgreen"],
    rosterPokemonIds: [95, 95, 107, 106, 68], // Onix, Onix, Hitmonchan, Hitmonlee, Machamp
  },
  {
    key: "kanto-e4-agatha",
    name: "Agatha",
    stage: "elite4",
    versionIds: ["firered", "leafgreen"],
    rosterPokemonIds: [94, 42, 93, 24, 94], // Gengar, Golbat, Haunter, Arbok, Gengar
  },
  {
    key: "kanto-e4-lance",
    name: "Lance",
    stage: "elite4",
    versionIds: ["firered", "leafgreen"],
    rosterPokemonIds: [148, 148, 142, 130, 149], // Dragonair, Dragonair, Aerodactyl, Gyarados, Dragonite
  },
  // Champion
  {
    key: "kanto-champion-blue",
    name: "Blue",
    stage: "champion",
    versionIds: ["firered", "leafgreen"],
    rosterPokemonIds: [18, 65, 112, 130, 59, 6], // Pidgeot, Alakazam, Rhydon, Gyarados, Arcanine, Charizard
  },
];

// ── Gen 2: Gold / Silver / Crystal ───────────────────────────────────────────

const GSC_BOSSES: BossEntry[] = [
  // Johto Gyms (main story only)
  {
    key: "johto-gsc-gym1-falkner",
    name: "Falkner",
    stage: "gym",
    gymOrder: 1,
    versionIds: ["gold", "silver", "crystal"],
    rosterPokemonIds: [16, 17], // Pidgey, Pidgeotto
  },
  {
    key: "johto-gsc-gym2-bugsy",
    name: "Bugsy",
    stage: "gym",
    gymOrder: 2,
    versionIds: ["gold", "silver", "crystal"],
    rosterPokemonIds: [14, 13, 123], // Metapod, Kakuna, Scyther
  },
  {
    key: "johto-gsc-gym3-whitney",
    name: "Whitney",
    stage: "gym",
    gymOrder: 3,
    versionIds: ["gold", "silver", "crystal"],
    rosterPokemonIds: [39, 241], // Clefairy, Miltank
  },
  {
    key: "johto-gsc-gym4-morty",
    name: "Morty",
    stage: "gym",
    gymOrder: 4,
    versionIds: ["gold", "silver", "crystal"],
    rosterPokemonIds: [92, 93, 93, 94], // Gastly, Haunter, Haunter, Gengar
  },
  {
    key: "johto-gsc-gym5-chuck",
    name: "Chuck",
    stage: "gym",
    gymOrder: 5,
    versionIds: ["gold", "silver", "crystal"],
    rosterPokemonIds: [57, 62], // Primeape, Poliwrath
  },
  {
    key: "johto-gsc-gym6-jasmine",
    name: "Jasmine",
    stage: "gym",
    gymOrder: 6,
    versionIds: ["gold", "silver", "crystal"],
    rosterPokemonIds: [81, 81, 208], // Magnemite, Magnemite, Steelix
  },
  {
    key: "johto-gsc-gym7-pryce",
    name: "Pryce",
    stage: "gym",
    gymOrder: 7,
    versionIds: ["gold", "silver", "crystal"],
    rosterPokemonIds: [86, 87, 221], // Seel, Dewgong, Piloswine
  },
  {
    key: "johto-gsc-gym8-clair",
    name: "Clair",
    stage: "gym",
    gymOrder: 8,
    versionIds: ["gold", "silver", "crystal"],
    rosterPokemonIds: [148, 148, 148, 230], // Dragonair, Dragonair, Dragonair, Kingdra
  },
  // Elite Four
  {
    key: "johto-gsc-e4-will",
    name: "Will",
    stage: "elite4",
    versionIds: ["gold", "silver", "crystal"],
    rosterPokemonIds: [178, 124, 103, 80, 178], // Xatu, Jynx, Exeggutor, Slowbro, Xatu
  },
  {
    key: "johto-gsc-e4-koga",
    name: "Koga",
    stage: "elite4",
    versionIds: ["gold", "silver", "crystal"],
    rosterPokemonIds: [168, 49, 205, 89, 169], // Ariados, Venomoth, Forretress, Muk, Crobat
  },
  {
    key: "johto-gsc-e4-bruno",
    name: "Bruno",
    stage: "elite4",
    versionIds: ["gold", "silver", "crystal"],
    rosterPokemonIds: [237, 106, 107, 95, 68], // Hitmontop, Hitmonlee, Hitmonchan, Onix, Machamp
  },
  {
    key: "johto-gsc-e4-karen",
    name: "Karen",
    stage: "elite4",
    versionIds: ["gold", "silver", "crystal"],
    rosterPokemonIds: [197, 45, 198, 94, 229], // Umbreon, Vileplume, Murkrow, Gengar, Houndoom
  },
  // Champion
  {
    key: "johto-gsc-champion-lance",
    name: "Lance",
    stage: "champion",
    versionIds: ["gold", "silver", "crystal"],
    rosterPokemonIds: [130, 149, 6, 142, 149, 149], // Gyarados, Dragonite, Charizard, Aerodactyl, Dragonite, Dragonite
  },
];

// ── Gen 2: HeartGold / SoulSilver ───────────────────────────────────────────

const HGSS_BOSSES: BossEntry[] = [
  // Johto Gyms
  {
    key: "johto-gym1-falkner",
    name: "Falkner",
    stage: "gym",
    gymOrder: 1,
    versionIds: ["heartgold", "soulsilver"],
    rosterPokemonIds: [16, 17], // Pidgey, Pidgeotto
  },
  {
    key: "johto-gym2-bugsy",
    name: "Bugsy",
    stage: "gym",
    gymOrder: 2,
    versionIds: ["heartgold", "soulsilver"],
    rosterPokemonIds: [14, 13, 123], // Metapod, Kakuna, Scyther
  },
  {
    key: "johto-gym3-whitney",
    name: "Whitney",
    stage: "gym",
    gymOrder: 3,
    versionIds: ["heartgold", "soulsilver"],
    rosterPokemonIds: [39, 241], // Clefairy, Miltank
  },
  {
    key: "johto-gym4-morty",
    name: "Morty",
    stage: "gym",
    gymOrder: 4,
    versionIds: ["heartgold", "soulsilver"],
    rosterPokemonIds: [92, 93, 94, 93], // Gastly, Haunter, Gengar, Haunter
  },
  {
    key: "johto-gym5-chuck-hg",
    name: "Chuck",
    stage: "gym",
    gymOrder: 5,
    versionIds: ["heartgold"],
    rosterPokemonIds: [57, 62], // Primeape, Poliwrath
  },
  {
    key: "johto-gym5-chuck-ss",
    name: "Chuck",
    stage: "gym",
    gymOrder: 5,
    versionIds: ["soulsilver"],
    rosterPokemonIds: [57, 62], // Primeape, Poliwrath
  },
  {
    key: "johto-gym6-jasmine",
    name: "Jasmine",
    stage: "gym",
    gymOrder: 6,
    versionIds: ["heartgold", "soulsilver"],
    rosterPokemonIds: [82, 82, 208], // Magnemite, Magnemite, Steelix
  },
  {
    key: "johto-gym7-pryce",
    name: "Pryce",
    stage: "gym",
    gymOrder: 7,
    versionIds: ["heartgold", "soulsilver"],
    rosterPokemonIds: [86, 87, 221], // Seel, Dewgong, Piloswine
  },
  {
    key: "johto-gym8-clair",
    name: "Clair",
    stage: "gym",
    gymOrder: 8,
    versionIds: ["heartgold", "soulsilver"],
    rosterPokemonIds: [148, 148, 130, 230], // Dragonair, Dragonair, Gyarados, Kingdra
  },
  // Elite Four
  {
    key: "johto-e4-will",
    name: "Will",
    stage: "elite4",
    versionIds: ["heartgold", "soulsilver"],
    rosterPokemonIds: [178, 124, 103, 80, 178], // Xatu, Jynx, Exeggutor, Slowbro, Xatu
  },
  {
    key: "johto-e4-koga",
    name: "Koga",
    stage: "elite4",
    versionIds: ["heartgold", "soulsilver"],
    rosterPokemonIds: [168, 49, 205, 89, 169], // Ariados, Venomoth, Forretress, Muk, Crobat
  },
  {
    key: "johto-e4-bruno",
    name: "Bruno",
    stage: "elite4",
    versionIds: ["heartgold", "soulsilver"],
    rosterPokemonIds: [95, 107, 106, 68, 237], // Onix, Hitmonchan, Hitmonlee, Machamp, Hitmontop
  },
  {
    key: "johto-e4-karen",
    name: "Karen",
    stage: "elite4",
    versionIds: ["heartgold", "soulsilver"],
    rosterPokemonIds: [198, 45, 94, 229, 197], // Murkrow, Vileplume, Gengar, Houndoom, Umbreon
  },
  // Champion
  {
    key: "johto-champion-lance",
    name: "Lance",
    stage: "champion",
    versionIds: ["heartgold", "soulsilver"],
    rosterPokemonIds: [130, 149, 149, 142, 149, 6], // Gyarados, Dragonite, Dragonite, Aerodactyl, Dragonite, Charizard
  },
];

// ── Gen 3: Hoenn (Ruby/Sapphire + Emerald) ───────────────────────────────────

const EMERALD_BOSSES: BossEntry[] = [
  // Hoenn Gyms
  {
    key: "hoenn-gym1-roxanne",
    name: "Roxanne",
    stage: "gym",
    gymOrder: 1,
    versionIds: ["ruby", "sapphire", "emerald"],
    rosterPokemonIds: [74, 299], // Geodude, Nosepass
  },
  {
    key: "hoenn-gym2-brawly",
    name: "Brawly",
    stage: "gym",
    gymOrder: 2,
    versionIds: ["ruby", "sapphire", "emerald"],
    rosterPokemonIds: [66, 307, 296], // Machop, Meditite, Makuhita
  },
  {
    key: "hoenn-gym3-wattson",
    name: "Wattson",
    stage: "gym",
    gymOrder: 3,
    versionIds: ["ruby", "sapphire", "emerald"],
    rosterPokemonIds: [100, 309, 82, 310], // Voltorb, Electrike, Magneton, Manectric
  },
  {
    key: "hoenn-gym4-flannery",
    name: "Flannery",
    stage: "gym",
    gymOrder: 4,
    versionIds: ["ruby", "sapphire", "emerald"],
    rosterPokemonIds: [322, 218, 323, 324], // Numel, Slugma, Camerupt, Torkoal
  },
  {
    key: "hoenn-gym5-norman",
    name: "Norman",
    stage: "gym",
    gymOrder: 5,
    versionIds: ["ruby", "sapphire", "emerald"],
    rosterPokemonIds: [327, 288, 264, 289], // Spinda, Vigoroth, Linoone, Slaking
  },
  {
    key: "hoenn-gym6-winona",
    name: "Winona",
    stage: "gym",
    gymOrder: 6,
    versionIds: ["ruby", "sapphire", "emerald"],
    rosterPokemonIds: [277, 279, 227, 334], // Swellow, Pelipper, Skarmory, Altaria
  },
  {
    key: "hoenn-gym7-tate-liza",
    name: "Tate & Liza",
    stage: "gym",
    gymOrder: 7,
    versionIds: ["ruby", "sapphire", "emerald"],
    rosterPokemonIds: [178, 344, 337, 338], // Xatu, Claydol, Lunatone, Solrock
  },
  {
    key: "hoenn-gym8-juan",
    name: "Juan",
    stage: "gym",
    gymOrder: 8,
    versionIds: ["emerald"],
    rosterPokemonIds: [370, 340, 364, 342, 230], // Luvdisc, Whiscash, Sealeo, Crawdaunt, Kingdra
  },
  {
    key: "hoenn-gym8-wallace",
    name: "Wallace",
    stage: "gym",
    gymOrder: 8,
    versionIds: ["ruby", "sapphire"],
    rosterPokemonIds: [370, 340, 364, 119, 350], // Luvdisc, Whiscash, Sealeo, Seaking, Milotic
  },
  // Elite Four
  {
    key: "hoenn-e4-sidney",
    name: "Sidney",
    stage: "elite4",
    versionIds: ["ruby", "sapphire"],
    rosterPokemonIds: [262, 274, 332, 319, 359], // Mightyena, Shiftry, Cacturne, Sharpedo, Absol
  },
  {
    key: "hoenn-e4-phoebe",
    name: "Phoebe",
    stage: "elite4",
    versionIds: ["ruby", "sapphire"],
    rosterPokemonIds: [356, 354, 354, 302, 356], // Dusclops, Banette, Banette, Sableye, Dusclops
  },
  {
    key: "hoenn-e4-glacia",
    name: "Glacia",
    stage: "elite4",
    versionIds: ["ruby", "sapphire"],
    rosterPokemonIds: [362, 364, 364, 362, 365], // Glalie, Sealeo, Sealeo, Glalie, Walrein
  },
  {
    key: "hoenn-e4-drake",
    name: "Drake",
    stage: "elite4",
    versionIds: ["ruby", "sapphire"],
    rosterPokemonIds: [372, 334, 330, 330, 373], // Shelgon, Altaria, Flygon, Flygon, Salamence
  },
  {
    key: "hoenn-e4-sidney",
    name: "Sidney",
    stage: "elite4",
    versionIds: ["emerald"],
    rosterPokemonIds: [262, 274, 332, 342, 359], // Mightyena, Shiftry, Cacturne, Crawdaunt, Absol
  },
  {
    key: "hoenn-e4-phoebe",
    name: "Phoebe",
    stage: "elite4",
    versionIds: ["emerald"],
    rosterPokemonIds: [356, 354, 354, 302, 356], // Dusclops, Banette, Banette, Sableye, Dusclops
  },
  {
    key: "hoenn-e4-glacia",
    name: "Glacia",
    stage: "elite4",
    versionIds: ["emerald"],
    rosterPokemonIds: [362, 364, 364, 362, 365], // Glalie, Sealeo, Sealeo, Glalie, Walrein
  },
  {
    key: "hoenn-e4-drake",
    name: "Drake",
    stage: "elite4",
    versionIds: ["emerald"],
    rosterPokemonIds: [372, 334, 330, 330, 373], // Shelgon, Altaria, Flygon, Flygon, Salamence
  },
  // Champion
  {
    key: "hoenn-champion-wallace",
    name: "Wallace",
    stage: "champion",
    versionIds: ["emerald"],
    rosterPokemonIds: [321, 73, 272, 340, 130, 350], // Wailord, Tentacruel, Ludicolo, Whiscash, Gyarados, Milotic
  },
  {
    key: "hoenn-champion-steven",
    name: "Steven",
    stage: "champion",
    versionIds: ["ruby", "sapphire"],
    rosterPokemonIds: [227, 344, 306, 346, 348, 376], // Skarmory, Claydol, Aggron, Cradily, Armaldo, Metagross
  },
];

// ── Gen 4: Platinum ──────────────────────────────────────────────────────────

const PLATINUM_BOSSES: BossEntry[] = [
  // Sinnoh Gyms
  {
    key: "sinnoh-gym1-roark",
    name: "Roark",
    stage: "gym",
    gymOrder: 1,
    versionIds: ["platinum"],
    rosterPokemonIds: [74, 138, 408], // Geodude, Omanyte→Omastar in Pt? No: Geodude, Onix, Cranidos
  },
  {
    key: "sinnoh-gym2-gardenia",
    name: "Gardenia",
    stage: "gym",
    gymOrder: 2,
    versionIds: ["platinum"],
    rosterPokemonIds: [420, 387, 407], // Cherubi, Turtwig, Roserade
  },
  {
    key: "sinnoh-gym3-maylene",
    name: "Maylene",
    stage: "gym",
    gymOrder: 3,
    versionIds: ["platinum"],
    rosterPokemonIds: [307, 67, 448], // Meditite, Machoke, Lucario
  },
  {
    key: "sinnoh-gym4-crasher-wake",
    name: "Crasher Wake",
    stage: "gym",
    gymOrder: 4,
    versionIds: ["platinum"],
    rosterPokemonIds: [130, 195, 419], // Gyarados, Quagsire, Floatzel
  },
  {
    key: "sinnoh-gym5-fantina",
    name: "Fantina",
    stage: "gym",
    gymOrder: 5,
    versionIds: ["platinum"],
    rosterPokemonIds: [355, 93, 429], // Duskull, Haunter, Mismagius
  },
  {
    key: "sinnoh-gym6-byron",
    name: "Byron",
    stage: "gym",
    gymOrder: 6,
    versionIds: ["platinum"],
    rosterPokemonIds: [82, 208, 411], // Magneton, Steelix, Bastiodon
  },
  {
    key: "sinnoh-gym7-candice",
    name: "Candice",
    stage: "gym",
    gymOrder: 7,
    versionIds: ["platinum"],
    rosterPokemonIds: [459, 215, 308, 460], // Snover, Sneasel, Medicham, Abomasnow
  },
  {
    key: "sinnoh-gym8-volkner",
    name: "Volkner",
    stage: "gym",
    gymOrder: 8,
    versionIds: ["platinum"],
    rosterPokemonIds: [135, 26, 405, 466], // Jolteon, Raichu, Luxray, Electivire
  },
  // Elite Four
  {
    key: "sinnoh-e4-aaron",
    name: "Aaron",
    stage: "elite4",
    versionIds: ["platinum"],
    rosterPokemonIds: [469, 212, 416, 214, 452], // Yanmega, Scizor, Vespiquen, Heracross, Drapion
  },
  {
    key: "sinnoh-e4-bertha",
    name: "Bertha",
    stage: "elite4",
    versionIds: ["platinum"],
    rosterPokemonIds: [340, 472, 450, 76, 464], // Whiscash, Gliscor, Hippowdon, Golem, Rhyperior
  },
  {
    key: "sinnoh-e4-flint",
    name: "Flint",
    stage: "elite4",
    versionIds: ["platinum"],
    rosterPokemonIds: [229, 136, 78, 392, 467], // Houndoom, Flareon, Rapidash, Infernape, Magmortar
  },
  {
    key: "sinnoh-e4-lucian",
    name: "Lucian",
    stage: "elite4",
    versionIds: ["platinum"],
    rosterPokemonIds: [122, 203, 308, 65, 437], // Mr. Mime, Girafarig, Medicham, Alakazam, Bronzong
  },
  // Champion
  {
    key: "sinnoh-champion-cynthia",
    name: "Cynthia",
    stage: "champion",
    versionIds: ["platinum"],
    rosterPokemonIds: [442, 407, 423, 448, 350, 445], // Spiritomb, Roserade, Gastrodon, Lucario, Milotic, Garchomp
  },
];

// ── Gen 4: Diamond / Pearl (distinct from Platinum) ──────────────────────────

const DP_BOSSES: BossEntry[] = [
  // Sinnoh Gyms — D/P have different rosters than Platinum in some cases
  {
    key: "sinnoh-dp-gym1-roark",
    name: "Roark",
    stage: "gym",
    gymOrder: 1,
    versionIds: ["diamond", "pearl"],
    rosterPokemonIds: [74, 95, 408], // Geodude, Onix, Cranidos
  },
  {
    key: "sinnoh-dp-gym2-gardenia",
    name: "Gardenia",
    stage: "gym",
    gymOrder: 2,
    versionIds: ["diamond", "pearl"],
    rosterPokemonIds: [420, 387, 407], // Cherubi, Turtwig, Roserade
  },
  {
    key: "sinnoh-dp-gym3-maylene",
    name: "Maylene",
    stage: "gym",
    gymOrder: 3,
    versionIds: ["diamond", "pearl"],
    rosterPokemonIds: [307, 67, 448], // Meditite, Machoke, Lucario
  },
  {
    key: "sinnoh-dp-gym4-crasher-wake",
    name: "Crasher Wake",
    stage: "gym",
    gymOrder: 4,
    versionIds: ["diamond", "pearl"],
    rosterPokemonIds: [130, 195, 419], // Gyarados, Quagsire, Floatzel
  },
  {
    key: "sinnoh-dp-gym5-fantina",
    name: "Fantina",
    stage: "gym",
    gymOrder: 5,
    versionIds: ["diamond", "pearl"],
    rosterPokemonIds: [426, 94, 429], // Drifblim, Gengar, Mismagius
  },
  {
    key: "sinnoh-dp-gym6-byron",
    name: "Byron",
    stage: "gym",
    gymOrder: 6,
    versionIds: ["diamond", "pearl"],
    rosterPokemonIds: [436, 208, 411], // Bronzor, Steelix, Bastiodon
  },
  {
    key: "sinnoh-dp-gym7-candice",
    name: "Candice",
    stage: "gym",
    gymOrder: 7,
    versionIds: ["diamond", "pearl"],
    rosterPokemonIds: [459, 215, 308, 460], // Snover, Sneasel, Medicham, Abomasnow
  },
  {
    key: "sinnoh-dp-gym8-volkner",
    name: "Volkner",
    stage: "gym",
    gymOrder: 8,
    versionIds: ["diamond", "pearl"],
    rosterPokemonIds: [26, 424, 224, 405], // Raichu, Ambipom, Octillery, Luxray
  },
  // Elite Four — D/P have different rosters (e.g. Flint uses Steelix, Lopunny)
  {
    key: "sinnoh-dp-e4-aaron",
    name: "Aaron",
    stage: "elite4",
    versionIds: ["diamond", "pearl"],
    rosterPokemonIds: [269, 267, 214, 416, 452], // Dustox, Beautifly, Heracross, Vespiquen, Drapion
  },
  {
    key: "sinnoh-dp-e4-bertha",
    name: "Bertha",
    stage: "elite4",
    versionIds: ["diamond", "pearl"],
    rosterPokemonIds: [195, 340, 76, 185, 450], // Quagsire, Whiscash, Golem, Sudowoodo, Hippowdon
  },
  {
    key: "sinnoh-dp-e4-flint",
    name: "Flint",
    stage: "elite4",
    versionIds: ["diamond", "pearl"],
    rosterPokemonIds: [78, 208, 428, 426, 392], // Rapidash, Steelix, Lopunny, Drifblim, Infernape
  },
  {
    key: "sinnoh-dp-e4-lucian",
    name: "Lucian",
    stage: "elite4",
    versionIds: ["diamond", "pearl"],
    rosterPokemonIds: [122, 203, 308, 65, 437], // Mr. Mime, Girafarig, Medicham, Alakazam, Bronzong
  },
  // Champion — Cynthia same across D/P/P
  {
    key: "sinnoh-dp-champion-cynthia",
    name: "Cynthia",
    stage: "champion",
    versionIds: ["diamond", "pearl"],
    rosterPokemonIds: [442, 423, 407, 350, 448, 445], // Spiritomb, Gastrodon, Roserade, Milotic, Lucario, Garchomp
  },
];

// ── Gen 5: Black / White ─────────────────────────────────────────────────────

const BW_BOSSES: BossEntry[] = [
  // Unova Gyms
  {
    key: "unova-gym1-chili",
    name: "Cilan/Chili/Cress",
    stage: "gym",
    gymOrder: 1,
    versionIds: ["black"],
    rosterPokemonIds: [506, 511], // Lillipup + element monkey (starter-dependent)
  },
  {
    key: "unova-gym1-cress",
    name: "Cilan/Chili/Cress",
    stage: "gym",
    gymOrder: 1,
    versionIds: ["white"],
    rosterPokemonIds: [506, 513], // Lillipup + element monkey (starter-dependent)
  },
  {
    key: "unova-gym2-lenora",
    name: "Lenora",
    stage: "gym",
    gymOrder: 2,
    versionIds: ["black", "white"],
    rosterPokemonIds: [506, 531], // Herdier, Watchog
  },
  {
    key: "unova-gym3-burgh",
    name: "Burgh",
    stage: "gym",
    gymOrder: 3,
    versionIds: ["black", "white"],
    rosterPokemonIds: [544, 557, 542], // Whirlipede, Dwebble, Leavanny
  },
  {
    key: "unova-gym4-elesa",
    name: "Elesa",
    stage: "gym",
    gymOrder: 4,
    versionIds: ["black", "white"],
    rosterPokemonIds: [587, 587, 523], // Emolga, Emolga, Zebstrika
  },
  {
    key: "unova-gym5-clay",
    name: "Clay",
    stage: "gym",
    gymOrder: 5,
    versionIds: ["black", "white"],
    rosterPokemonIds: [552, 536, 530], // Krokorok, Palpitoad, Excadrill
  },
  {
    key: "unova-gym6-skyla",
    name: "Skyla",
    stage: "gym",
    gymOrder: 6,
    versionIds: ["black", "white"],
    rosterPokemonIds: [528, 521, 581], // Swoobat, Unfezant, Swanna
  },
  {
    key: "unova-gym7-brycen",
    name: "Brycen",
    stage: "gym",
    gymOrder: 7,
    versionIds: ["black", "white"],
    rosterPokemonIds: [583, 615, 614], // Vanillish, Cryogonal, Beartic
  },
  {
    key: "unova-gym8-drayden",
    name: "Drayden",
    stage: "gym",
    gymOrder: 8,
    versionIds: ["black"],
    rosterPokemonIds: [611, 621, 612], // Fraxure, Druddigon, Haxorus
  },
  {
    key: "unova-gym8-iris",
    name: "Iris",
    stage: "gym",
    gymOrder: 8,
    versionIds: ["white"],
    rosterPokemonIds: [611, 621, 612], // Fraxure, Druddigon, Haxorus
  },
  // Elite Four
  {
    key: "unova-e4-shauntal",
    name: "Shauntal",
    stage: "elite4",
    versionIds: ["black", "white"],
    rosterPokemonIds: [563, 593, 623, 609], // Cofagrigus, Jellicent, Golurk, Chandelure
  },
  {
    key: "unova-e4-marshal",
    name: "Marshal",
    stage: "elite4",
    versionIds: ["black", "white"],
    rosterPokemonIds: [538, 539, 534, 620], // Throh, Sawk, Conkeldurr, Mienshao
  },
  {
    key: "unova-e4-grimsley",
    name: "Grimsley",
    stage: "elite4",
    versionIds: ["black", "white"],
    rosterPokemonIds: [560, 553, 510, 625], // Scrafty, Krookodile, Liepard, Bisharp
  },
  {
    key: "unova-e4-caitlin",
    name: "Caitlin",
    stage: "elite4",
    versionIds: ["black", "white"],
    rosterPokemonIds: [518, 579, 576, 561], // Musharna, Gothitelle, Sigilyph, Reuniclus? canonical BW: Musharna, Gothitelle, Sigilyph, Reuniclus
  },
  // Champion
  {
    key: "unova-champion-alder",
    name: "Alder",
    stage: "champion",
    versionIds: ["black", "white"],
    rosterPokemonIds: [589, 628, 553, 576, 635, 609], // Escavalier, Braviary, Krookodile, Reuniclus, Hydreigon (Lv69), Chandelure
  },
];

// ── Registry ─────────────────────────────────────────────────────────────────

export const ALL_GAME_BOSSES: GameBossData[] = [
  {
    gameId: 1,
    generation: 1,
    versionIds: ["red", "blue", "yellow"],
    bosses: RBY_BOSSES,
  },
  {
    gameId: 2,
    generation: 2,
    versionIds: ["gold", "silver", "crystal"],
    bosses: GSC_BOSSES,
  },
  {
    gameId: 3,
    generation: 3,
    versionIds: ["ruby", "sapphire", "emerald"],
    bosses: EMERALD_BOSSES,
  },
  {
    gameId: 4,
    generation: 4,
    versionIds: ["diamond", "pearl", "platinum"],
    bosses: [...DP_BOSSES, ...PLATINUM_BOSSES],
  },
  {
    gameId: 5,
    generation: 5,
    versionIds: ["black", "white"],
    bosses: BW_BOSSES,
  },
  {
    gameId: 12,
    generation: 3,
    versionIds: ["firered", "leafgreen"],
    bosses: FRLG_BOSSES,
  },
  {
    gameId: 13,
    generation: 4,
    versionIds: ["heartgold", "soulsilver"],
    bosses: HGSS_BOSSES,
  },
];

export function getBossesForGame(
  gameId: number,
  selectedVersionId?: string | null
): BossEntry[] {
  const gameData = ALL_GAME_BOSSES.find((g) => g.gameId === gameId);
  if (!gameData) return [];

  const withLevels = (boss: BossEntry): BossEntry => {
    if (boss.rosterLevels && boss.rosterLevels.length === boss.rosterPokemonIds.length) {
      return boss;
    }
    const count = boss.rosterPokemonIds.length;
    if (count === 0) return { ...boss, rosterLevels: [] };

    let min = 1;
    let max = 1;
    if (boss.stage === "gym") {
      const order = boss.gymOrder ?? 3;
      if (order <= 1) {
        min = 12; max = 14;
      } else if (order === 2) {
        min = 18; max = 21;
      } else if (order === 3) {
        min = 22; max = 26;
      } else if (order === 4) {
        min = 28; max = 32;
      } else if (order === 5) {
        min = 31; max = 36;
      } else if (order === 6) {
        min = 35; max = 40;
      } else if (order === 7) {
        min = 40; max = 45;
      } else {
        min = 43; max = 48;
      }
    } else if (boss.stage === "elite4") {
      min = 48;
      max = 58;
    } else {
      min = 55;
      max = 65;
    }

    const levels = Array.from({ length: count }, (_, i) => {
      if (count === 1) return max;
      const t = i / (count - 1);
      return Math.round(min + (max - min) * t);
    });
    return { ...boss, rosterLevels: levels };
  };

  if (!selectedVersionId) {
    // Deduplicate by key when no version selected — return one entry per key
    const seen = new Set<string>();
    const result: BossEntry[] = [];
    for (const boss of gameData.bosses) {
      if (!seen.has(boss.key)) {
        seen.add(boss.key);
        result.push(withLevels(boss));
      }
    }
    return result;
  }

  return gameData.bosses
    .filter((boss) => boss.versionIds.includes(selectedVersionId))
    .map(withLevels);
}

export function isSupportedGame(gameId: number): boolean {
  return ALL_GAME_BOSSES.some((g) => g.gameId === gameId);
}
