"use client";

import Image from "~/components/ui/AppImage";
import { PokemonTypeBadge } from "@/components/ui/PokemonTypeBadge";
import { pokemonSpriteSrc } from "@/lib/image";
import type { Pokemon } from "@/lib/types";

interface PokemonDragPreviewProps {
  pokemon: Pokemon;
}

const PokemonDragPreview = ({ pokemon }: PokemonDragPreviewProps) => {
  return (
    <div
      className="pointer-events-none rotate-2 scale-105 overflow-hidden rounded-xl shadow-2xl"
      style={{
        background: "var(--surface-1)",
        border: "2px solid var(--version-color-border, rgba(218, 44, 67, 0.4))",
        boxShadow: "0 20px 40px rgba(40, 28, 18, 0.25), 0 0 24px var(--version-color-soft, rgba(218, 44, 67, 0.16))",
      }}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
          <Image src={pokemonSpriteSrc(pokemon.sprite, pokemon.id)} alt={pokemon.name} width={40} height={40} unoptimized className="h-10 w-10 object-contain drop-shadow-lg" priority />
        </div>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            {pokemon.name}
          </h3>
          <div className="mt-0.5 flex gap-1">
            {pokemon.types.map((type: string) => (
              <PokemonTypeBadge key={type} pokemonType={type} size="xs">
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </PokemonTypeBadge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PokemonDragPreview;
