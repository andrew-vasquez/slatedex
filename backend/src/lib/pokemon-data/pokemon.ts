import type { Game, GenerationMeta } from "./types";

export const NATIONAL_DEX_GAME_ID = 99;
export const NATIONAL_DEX_GENERATION = 9;

export const NATIONAL_DEX_GAME: Game = {
  id: NATIONAL_DEX_GAME_ID,
  name: "National Dex Sandbox",
  generation: NATIONAL_DEX_GENERATION,
  region: "All Pokémon",
  versions: [{ id: "all", label: "All" }],
  versionGroupCandidates: [],
  regionalDexCandidates: [],
  starters: ["bulbasaur", "charmander", "squirtle"],
  legendaries: ["mewtwo", "rayquaza", "arceus"],
};

export const GENERATION_META: GenerationMeta[] = [
  {
    generation: 1,
    region: "Kanto",
    primaryName: "Red/Blue/Yellow",
    starters: ["bulbasaur", "charmander", "squirtle"],
    legendaries: ["mewtwo"],
    games: [
      {
        id: 1,
        name: "Red/Blue/Yellow",
        generation: 1,
        region: "Kanto",
        versions: [
          { id: "red", label: "Red" },
          { id: "blue", label: "Blue" },
          { id: "yellow", label: "Yellow" },
        ],
        versionGroupCandidates: ["red-blue", "yellow"],
        regionalDexCandidates: ["kanto"],
        preMainStoryDexCandidates: ["kanto"],
        starters: ["bulbasaur", "charmander", "squirtle"],
        legendaries: ["mewtwo"],
      },
    ],
  },
  {
    generation: 2,
    region: "Johto",
    primaryName: "Gold/Silver/Crystal",
    starters: ["chikorita", "cyndaquil", "totodile"],
    legendaries: ["lugia", "ho-oh"],
    games: [
      {
        id: 2,
        name: "Gold/Silver/Crystal",
        generation: 2,
        region: "Johto",
        versions: [
          { id: "gold", label: "Gold" },
          { id: "silver", label: "Silver" },
          { id: "crystal", label: "Crystal" },
        ],
        versionGroupCandidates: ["gold-silver", "crystal"],
        regionalDexCandidates: ["original-johto", "updated-johto", "johto"],
        preMainStoryDexCandidates: ["original-johto", "updated-johto", "johto"],
        starters: ["chikorita", "cyndaquil", "totodile"],
        legendaries: ["lugia", "ho-oh"],
      },
    ],
  },
  {
    generation: 3,
    region: "Hoenn",
    primaryName: "Ruby/Sapphire/Emerald",
    starters: ["treecko", "torchic", "mudkip"],
    legendaries: ["rayquaza"],
    games: [
      {
        id: 3,
        name: "Ruby/Sapphire/Emerald",
        generation: 3,
        region: "Hoenn",
        versions: [
          { id: "ruby", label: "Ruby" },
          { id: "sapphire", label: "Sapphire" },
          { id: "emerald", label: "Emerald" },
        ],
        versionGroupCandidates: ["ruby-sapphire", "emerald"],
        regionalDexCandidates: ["hoenn"],
        preMainStoryDexCandidates: ["hoenn"],
        starters: ["treecko", "torchic", "mudkip"],
        legendaries: ["rayquaza"],
      },
      {
        id: 12,
        name: "FireRed/LeafGreen",
        generation: 3,
        region: "Kanto",
        versions: [
          { id: "firered", label: "FireRed" },
          { id: "leafgreen", label: "LeafGreen" },
        ],
        versionGroupCandidates: ["firered-leafgreen"],
        regionalDexCandidates: ["kanto"],
        preMainStoryDexCandidates: ["kanto"],
        starters: ["bulbasaur", "charmander", "squirtle"],
        legendaries: ["mewtwo"],
      },
    ],
  },
  {
    generation: 4,
    region: "Sinnoh",
    primaryName: "Diamond/Pearl/Platinum",
    starters: ["turtwig", "chimchar", "piplup"],
    legendaries: ["arceus"],
    games: [
      {
        id: 4,
        name: "Diamond/Pearl/Platinum",
        generation: 4,
        region: "Sinnoh",
        versions: [
          { id: "diamond", label: "Diamond" },
          { id: "pearl", label: "Pearl" },
          { id: "platinum", label: "Platinum" },
        ],
        versionGroupCandidates: ["diamond-pearl", "platinum"],
        regionalDexCandidates: ["extended-sinnoh", "original-sinnoh", "sinnoh"],
        preMainStoryDexCandidates: ["extended-sinnoh", "original-sinnoh", "sinnoh"],
        starters: ["turtwig", "chimchar", "piplup"],
        legendaries: ["arceus"],
      },
      {
        id: 13,
        name: "HeartGold/SoulSilver",
        generation: 4,
        region: "Johto",
        versions: [
          { id: "heartgold", label: "HeartGold" },
          { id: "soulsilver", label: "SoulSilver" },
        ],
        versionGroupCandidates: ["heartgold-soulsilver"],
        regionalDexCandidates: ["updated-johto", "original-johto", "johto"],
        preMainStoryDexCandidates: ["updated-johto", "original-johto", "johto"],
        starters: ["chikorita", "cyndaquil", "totodile"],
        legendaries: ["lugia", "ho-oh"],
      },
    ],
  },
  {
    generation: 5,
    region: "Unova",
    primaryName: "Black/White",
    starters: ["snivy", "tepig", "oshawott"],
    legendaries: ["zekrom"],
    games: [
      {
        id: 5,
        name: "Black/White",
        generation: 5,
        region: "Unova",
        versions: [
          { id: "black", label: "Black" },
          { id: "white", label: "White" },
        ],
        versionGroupCandidates: ["black-white"],
        regionalDexCandidates: ["unova", "original-unova", "updated-unova"],
        preMainStoryDexCandidates: ["unova", "original-unova"],
        starters: ["snivy", "tepig", "oshawott"],
        legendaries: ["zekrom"],
      },
    ],
  },
  {
    generation: 6,
    region: "Kalos",
    primaryName: "X/Y",
    starters: ["chespin", "fennekin", "froakie"],
    legendaries: ["xerneas", "yveltal"],
    games: [
      {
        id: 6,
        name: "X/Y",
        generation: 6,
        region: "Kalos",
        versions: [
          { id: "x", label: "X" },
          { id: "y", label: "Y" },
        ],
        versionGroupCandidates: ["x-y"],
        regionalDexCandidates: ["kalos-central", "kalos-coastal", "kalos-mountain"],
        preMainStoryDexCandidates: ["kalos-central", "kalos-coastal", "kalos-mountain"],
        starters: ["chespin", "fennekin", "froakie"],
        legendaries: ["xerneas", "yveltal"],
      },
      {
        id: 7,
        name: "Omega Ruby/Alpha Sapphire",
        generation: 6,
        region: "Hoenn",
        versions: [
          { id: "omega-ruby", label: "Omega Ruby" },
          { id: "alpha-sapphire", label: "Alpha Sapphire" },
        ],
        versionGroupCandidates: ["omega-ruby-alpha-sapphire"],
        regionalDexCandidates: ["hoenn"],
        preMainStoryDexCandidates: ["hoenn"],
        starters: ["treecko", "torchic", "mudkip"],
        legendaries: ["groudon", "kyogre"],
      },
    ],
  },
  {
    generation: 7,
    region: "Alola",
    primaryName: "Sun/Moon",
    starters: ["rowlet", "litten", "popplio"],
    legendaries: ["solgaleo", "lunala"],
    games: [
      {
        id: 8,
        name: "Sun/Moon",
        generation: 7,
        region: "Alola",
        versions: [
          { id: "sun", label: "Sun" },
          { id: "moon", label: "Moon" },
        ],
        versionGroupCandidates: ["sun-moon"],
        regionalDexCandidates: ["original-alola", "akala", "melemele", "ulaula", "poni"],
        preMainStoryDexCandidates: ["original-alola", "akala", "melemele", "ulaula", "poni"],
        starters: ["rowlet", "litten", "popplio"],
        legendaries: ["solgaleo", "lunala"],
      },
      {
        id: 9,
        name: "Ultra Sun/Ultra Moon",
        generation: 7,
        region: "Alola",
        versions: [
          { id: "ultra-sun", label: "Ultra Sun" },
          { id: "ultra-moon", label: "Ultra Moon" },
        ],
        versionGroupCandidates: ["ultra-sun-ultra-moon"],
        regionalDexCandidates: ["updated-alola"],
        preMainStoryDexCandidates: ["updated-alola"],
        starters: ["rowlet", "litten", "popplio"],
        legendaries: ["necrozma"],
      },
      {
        id: 14,
        name: "Let's Go Pikachu/Eevee",
        generation: 7,
        region: "Kanto",
        versions: [
          { id: "lets-go-pikachu", label: "Let's Go, Pikachu!" },
          { id: "lets-go-eevee", label: "Let's Go, Eevee!" },
        ],
        versionGroupCandidates: ["lets-go-pikachu-lets-go-eevee"],
        regionalDexCandidates: ["letsgo-kanto", "kanto"],
        preMainStoryDexCandidates: ["letsgo-kanto", "kanto"],
        starters: ["bulbasaur", "charmander", "squirtle"],
        legendaries: ["mewtwo"],
      },
    ],
  },
  {
    generation: 8,
    region: "Galar",
    primaryName: "Sword/Shield",
    starters: ["grookey", "scorbunny", "sobble"],
    legendaries: ["zacian", "zamazenta"],
    games: [
      {
        id: 10,
        name: "Sword/Shield",
        generation: 8,
        region: "Galar",
        versions: [
          { id: "sword", label: "Sword" },
          { id: "shield", label: "Shield" },
        ],
        versionGroupCandidates: ["sword-shield"],
        regionalDexCandidates: ["galar", "isle-of-armor", "crown-tundra"],
        preMainStoryDexCandidates: ["galar"],
        postgameDexCandidates: ["isle-of-armor", "crown-tundra"],
        starters: ["grookey", "scorbunny", "sobble"],
        legendaries: ["zacian", "zamazenta"],
      },
    ],
  },
  {
    generation: 9,
    region: "Paldea",
    primaryName: "Scarlet/Violet",
    starters: ["sprigatito", "fuecoco", "quaxly"],
    legendaries: ["koraidon", "miraidon"],
    games: [
      {
        id: 11,
        name: "Scarlet/Violet",
        generation: 9,
        region: "Paldea",
        versions: [
          { id: "scarlet", label: "Scarlet" },
          { id: "violet", label: "Violet" },
        ],
        versionGroupCandidates: ["scarlet-violet"],
        regionalDexCandidates: ["paldea", "kitakami", "blueberry"],
        preMainStoryDexCandidates: ["paldea"],
        postgameDexCandidates: ["kitakami", "blueberry"],
        starters: ["sprigatito", "fuecoco", "quaxly"],
        legendaries: ["koraidon", "miraidon"],
      },
    ],
  },
];

export function getGenerationMeta(generation: number): GenerationMeta | undefined {
  return GENERATION_META.find((g) => g.generation === generation);
}

export function getGamesForGeneration(generation: number): Game[] {
  return getGenerationMeta(generation)?.games ?? [];
}

export function isNationalDexGame(generation: number, gameId: number): boolean {
  return generation === NATIONAL_DEX_GENERATION && gameId === NATIONAL_DEX_GAME_ID;
}
