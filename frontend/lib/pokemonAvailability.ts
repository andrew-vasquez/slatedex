/**
 * Game-specific Pokémon availability by story progression.
 *
 * Maps: versionId → { nationalDexId → firstAccessibleGymOrder }
 *
 * `firstAccessibleGymOrder` = the gym order you are working toward when you
 * can first obtain this Pokémon in normal gameplay (wild, gift, trade, or egg).
 *
 * - 1  = available from the start (before or around Gym 1)
 * - 2–8 = accessible when heading toward that gym (past the previous one)
 * - 9  = requires all 8 badges (Victory Road, post-story areas, or
 *         events that unlock only after story completion)
 *
 * Pokémon NOT listed default to 1 (available from the start).
 * Elite Four / Champion stage checkpoints always skip availability checks.
 */

type GymAvailability = Record<number, number>;

// ── Gen 1: Kanto (Red / Blue / Yellow / FireRed / LeafGreen) ─────────────────

const kantoAvailability: GymAvailability = {
  // ── Trades accessible around Gym 2–3 area ──
  122: 2, // Mr. Mime: Route 2 trade
  124: 3, // Jynx: Cerulean City trade (for Poliwhirl)

  // ── Celadon City / Game Corner (~Gym 4) ──
  133: 4, // Eevee: Celadon Mansion gift
  137: 4, // Porygon: Celadon Game Corner

  // ── Snorlax: needs Poké Flute (clears Pokémon Tower via Silph Scope quest, ~Gym 4-5) ──
  143: 5, // Snorlax: Route 12 / Route 16

  // ── Safari Zone in Fuchsia City (~Gym 5) ──
  113: 5, // Chansey
  115: 5, // Kangaskhan
  123: 5, // Scyther (also Blue/LG Game Corner)
  127: 5, // Pinsir (Safari Zone / Red/FR Game Corner)
  128: 5, // Tauros

  // ── Power Plant — requires Surf (~Gym 5) ──
  145: 5, // Zapdos

  // ── Silph Co. / Saffron City (~Gym 5–6) ──
  131: 6, // Lapras: Silph Co. gift
  106: 6, // Hitmonlee: Fighting Dojo
  107: 6, // Hitmonchan: Fighting Dojo

  // ── Seafoam Islands — requires Surf + Strength (~Gym 6) ──
  144: 6, // Articuno

  // ── Cinnabar Island — requires Surf to reach (~Gym 7) ──
  126: 7, // Magmar: Pokémon Mansion (Blue/LG; Red/FR has Electabuzz instead)
  125: 7, // Electabuzz: Pokémon Mansion (Red/FR; Blue/LG has Power Plant version at gym 5)
  132: 7, // Ditto: Pokémon Mansion
  138: 7, // Omanyte: fossil revival
  139: 7, // Omastar
  140: 7, // Kabuto: fossil revival
  141: 7, // Kabutops
  142: 7, // Aerodactyl: Old Amber revival

  // ── Victory Road / Mt. Ember (~Gym 8) ──
  146: 8, // Moltres: Victory Road (RBY) / Mt. Ember (FR/LG)

  // ── Post–Elite Four ──
  150: 9, // Mewtwo: Cerulean Cave (unlocks after becoming Champion)
};

// ── Gen 2: Johto (Gold / Silver / Crystal / HeartGold / SoulSilver) ──────────

const johtoAvailability: GymAvailability = {
  // ── Goldenrod City area (~Gym 3) ──
  133: 4, // Eevee: Bill's house (after he visits Ecruteak ~Gym 4)

  // ── Squirt Bottle from Goldenrod Flower Shop unlocked ~Gym 3 ──
  185: 4, // Sudowoodo: Route 36

  // ── Eevee evolutions (after obtaining Eevee ~Gym 4) ──
  196: 4, // Espeon
  197: 4, // Umbreon

  // ── Burned Tower event (~Gym 4) unlocks legendary beasts ──
  243: 5, // Raikou: roaming (after Burned Tower)
  244: 5, // Entei:  roaming (after Burned Tower)
  245: 5, // Suicune: roaming / stationary (Crystal/HGSS)

  // ── Dragon's Den — all 8 Johto badges required to enter ──
  147: 8, // Dratini
  148: 8, // Dragonair
  149: 8, // Dragonite

  // ── Whirl Islands — Whirlpool HM (from Lance post-Rocket HQ ~Gym 7) ──
  249: 8, // Lugia

  // ── Tin Tower — Rainbow Wing + story events (~Gym 7–8) ──
  250: 8, // Ho-Oh

  // ── Mt. Silver — post–Elite Four (requires all 16 badges) ──
  215: 9, // Sneasel: Route 28 / Mt. Silver
  246: 9, // Larvitar: Mt. Silver
  247: 9, // Pupitar
  248: 9, // Tyranitar

  // ── Kanto visit only (post–Elite Four) ──
  137: 9, // Porygon: Celadon Game Corner
};

// ── Gen 3: Hoenn (Ruby / Sapphire / Emerald) ─────────────────────────────────

const hoennAvailability: GymAvailability = {
  // ── Requires Surf (HM03, given after Gym 5 – Norman in Petalburg) ──
  // Routes 119–122 become accessible when heading toward Gym 6 (Winona/Fortree)
  349: 6, // Feebas: Route 119 (special fishing tiles)
  350: 6, // Milotic: evolve Feebas
  351: 6, // Castform: Weather Institute gift (Route 119)
  357: 6, // Tropius: Route 119
  358: 6, // Chimecho: Mt. Pyre (Route 122, requires Surf)
  359: 6, // Absol: Route 120

  // ── Devon Scope needed (Steven gives it in Meteor Falls post-Gym 6) ──
  352: 7, // Kecleon: Routes 119–123

  // ── Requires Dive (HM08, obtained after Gym 7 – Tate & Liza in Mossdeep) ──
  366: 8, // Clamperl: underwater Routes 124–126
  367: 8, // Huntail: evolve Clamperl
  368: 8, // Gorebyss: evolve Clamperl
  369: 8, // Relicanth: underwater Routes 124–126

  // ── Requires Waterfall (HM07, obtained post-Gym 8 / Sootopolis story) ──
  // Meteor Falls hidden back area only accessible after Waterfall
  371: 9, // Bagon
  372: 9, // Shelgon
  373: 9, // Salamence

  // ── Post-Champion events ──
  374: 9, // Beldum: Steven's house gift (after becoming Champion)
  375: 9, // Metang
  376: 9, // Metagross

  // ── Post-story legendaries ──
  380: 9, // Latias: roaming post-story (Ruby/Emerald)
  381: 9, // Latios: roaming post-story (Sapphire/Emerald)
  382: 9, // Kyogre: Cave of Origin / Seafloor Cavern (story)
  383: 9, // Groudon: Cave of Origin / Magma Hideout (story)
  384: 9, // Rayquaza: Sky Pillar (post-story)
};

// ── Gen 4: Sinnoh (Diamond / Pearl / Platinum) ───────────────────────────────

const sinnohAvailability: GymAvailability = {
  // ── Eterna Forest area (~Gym 2) ──
  479: 3, // Rotom: Old Chateau (accessible from Eterna Forest post-Cut ~Gym 2-3)

  // ── Wayward Cave hidden entrance (under Cycling Road, after Eterna ~Gym 2-3) ──
  443: 3, // Gible
  444: 3, // Gabite
  445: 3, // Garchomp

  // ── Hallowed Tower on Route 209 (Solaceon area, ~Gym 4-5) ──
  442: 4, // Spiritomb: requires Odd Keystone + 32 underground greetings

  // ── Iron Island — Riley gives Riolu egg after Canalave (~Gym 6) ──
  447: 6, // Riolu (egg)
  448: 6, // Lucario

  // ── Routes 216–217 / Snowpoint Temple area (~Gym 7) ──
  361: 7, // Snorunt: Route 216
  362: 7, // Glalie
  459: 7, // Snover: Route 216
  460: 7, // Abomasnow
  478: 7, // Froslass: evolve Snorunt with Dawn Stone

  // ── Lake Trio / Coronet legendaries (story events ~Gym 7-8) ──
  480: 9, // Uxie:   Lake Acuity (post-story)
  481: 9, // Mesprit: Lake Verity (post-story, roaming)
  482: 9, // Azelf:  Lake Valor (post-story)
  483: 9, // Dialga: Spear Pillar storyline
  484: 9, // Palkia: Spear Pillar storyline

  // ── Post-story ──
  487: 9, // Giratina: Distortion World / Sendoff Spring
  488: 9, // Cresselia: Fullmoon Island (post-story)
  491: 9, // Darkrai: Newmoon Island (event/post-game)
  492: 9, // Shaymin: Flower Paradise (event/post-game)
};

// ── Gen 5: Unova (Black / White) ─────────────────────────────────────────────

const unovaAvailability: GymAvailability = {
  // ── Mistralton Cave (Route 6 area, after Driftveil/Clay ~Gym 5) ──
  610: 6, // Axew: Mistralton Cave
  611: 6, // Fraxure
  612: 6, // Haxorus

  // ── Celestial Tower (Route 7, heading toward Mistralton ~Gym 6) ──
  607: 7, // Litwick: Celestial Tower
  608: 7, // Lampent

  // ── Route 7 / Twist Mountain area (~Gym 7) ──
  613: 7, // Cubchoo: Route 7
  614: 7, // Beartic

  // ── Route 18 — Larvesta egg, requires Surf/access to western routes (~Gym 7-8) ──
  636: 8, // Larvesta egg (woman's house on Route 18)

  // ── Victory Road / late areas ──
  633: 9, // Deino: Route 10 / Victory Road
  634: 9, // Zweilous
  635: 9, // Hydreigon

  // ── Relic Castle basement (post-story Pokémon) ──
  637: 9, // Volcarona

  // ── Swords of Justice ──
  638: 9, // Cobalion: Victory Road (after story)
  639: 9, // Terrakion: Victory Road (after story)
  // 640 Virizion is in Pinwheel Forest (~Gym 3 area) — not restricted here

  // ── Story / Roaming legendaries ──
  641: 9, // Tornadus (Black): roaming post-story
  642: 9, // Thundurus (White): roaming post-story
  643: 9, // Reshiram: N's Castle storyline
  644: 9, // Zekrom:  N's Castle storyline
  646: 9, // Kyurem:  Giant Chasm
};

// ── Main version → availability map ─────────────────────────────────────────

const POKEMON_FIRST_AVAILABLE_GYM: Record<string, GymAvailability> = {
  // Gen 1
  red:       kantoAvailability,
  blue:      kantoAvailability,
  yellow:    kantoAvailability,
  firered:   kantoAvailability,
  leafgreen: kantoAvailability,

  // Gen 2
  gold:       johtoAvailability,
  silver:     johtoAvailability,
  crystal:    johtoAvailability,
  heartgold:  johtoAvailability,
  soulsilver: johtoAvailability,

  // Gen 3
  ruby:     hoennAvailability,
  sapphire: hoennAvailability,
  emerald:  hoennAvailability,

  // Gen 4
  diamond:  sinnohAvailability,
  pearl:    sinnohAvailability,
  platinum: sinnohAvailability,

  // Gen 5
  black:     unovaAvailability,
  white:     unovaAvailability,
  "black-2": unovaAvailability,
  "white-2": unovaAvailability,
};

/**
 * Returns the minimum gym order required to obtain the given Pokémon in the
 * specified game version. Returns 1 if the version is unknown or the Pokémon
 * is available from the start of the game.
 */
export function getPokemonFirstGym(
  versionId: string | null | undefined,
  pokemonId: number
): number {
  if (!versionId) return 1;
  const versionMap = POKEMON_FIRST_AVAILABLE_GYM[versionId];
  if (!versionMap) return 1;
  return versionMap[pokemonId] ?? 1;
}
