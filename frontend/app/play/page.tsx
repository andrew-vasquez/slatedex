import type { Metadata } from "next";
import GameSelector from "@/app/play/GameSelector";

export const metadata: Metadata = {
  title: "Choose a Generation for Team Building | Slatedex",
  description:
    "Choose a Pokémon generation, compare regions and starters, and start building a stronger team with Slatedex coverage analysis and recommendations.",
};

export default function PlayPage() {
  return <GameSelector />;
}
