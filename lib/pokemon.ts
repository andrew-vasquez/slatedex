import type { Game } from "@/lib/types";

/**
 * Pokemon Game metadata.
 * Pokemon species data is now fetched from PokeAPI at build time.
 */
export const MAINLINE_GAMES: Game[] = [
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
    starters: ["bulbasaur", "charmander", "squirtle"],
    legendaries: ["mewtwo"],
  },
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
    starters: ["chikorita", "cyndaquil", "totodile"],
    legendaries: ["lugia", "ho-oh"],
  },
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
    starters: ["treecko", "torchic", "mudkip"],
    legendaries: ["rayquaza"],
  },
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
    starters: ["turtwig", "chimchar", "piplup"],
    legendaries: ["arceus"],
  },
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
    starters: ["snivy", "tepig", "oshawott"],
    legendaries: ["zekrom"],
  },
];
