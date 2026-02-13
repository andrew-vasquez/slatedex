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
    versionGroupCandidates: ["black-white"],
    regionalDexCandidates: ["unova", "original-unova", "updated-unova"],
    starters: ["snivy", "tepig", "oshawott"],
    legendaries: ["zekrom"],
  },
];
