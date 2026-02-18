import type { Metadata } from "next";
import GameSelector from "@/components/game/GameSelector";

export const metadata: Metadata = {
  title: "Pick a Generation | Slatedex",
  description: "Choose your Pokémon game generation and start building your team with type coverage, smart picks, and defensive analysis.",
};

export default function PlayPage() {
  return <GameSelector />;
}
