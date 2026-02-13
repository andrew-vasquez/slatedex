import type { Game } from "@/lib/types";

/**
 * Pokemon Game metadata.
 * Pokemon species data is now fetched from PokeAPI at build time.
 */
export const MAINLINE_GAMES: Game[] = [
  {
    id: 1,
    name: "R/B/Y",
    generation: 1,
    region: "Kanto",
    starters: ["bulbasaur", "charmander", "squirtle"],
    legendaries: ["mewtwo"],
  },
  {
    id: 2,
    name: "G/S/C",
    generation: 2,
    region: "Johto",
    starters: ["chikorita", "cyndaquil", "totodile"],
    legendaries: ["lugia", "ho-oh"],
  },
  {
    id: 3,
    name: "R/S/E",
    generation: 3,
    region: "Hoenn",
    starters: ["treecko", "torchic", "mudkip"],
    legendaries: ["rayquaza"],
  },
  {
    id: 4,
    name: "D/P/PT",
    generation: 4,
    region: "Sinnoh",
    starters: ["turtwig", "chimchar", "piplup"],
    legendaries: ["arceus"],
  },
  {
    id: 5,
    name: "B/W",
    generation: 5,
    region: "Unova",
    starters: ["snivy", "tepig", "oshawott"],
    legendaries: ["zekrom"],
  },
];
