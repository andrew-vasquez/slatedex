"use client";

import Image from "next/image";
import { TYPE_COLORS } from "@/lib/constants";
import type { Pokemon } from "@/lib/types";

interface PokemonDragPreviewProps {
  pokemon: Pokemon;
}

const PokemonDragPreview = ({ pokemon }: PokemonDragPreviewProps) => {
  return (
    <div
      className="rounded-xl shadow-2xl overflow-hidden pointer-events-none transform rotate-3 scale-105"
      style={{
        background: "var(--surface-1)",
        border: "2px solid rgba(229, 62, 62, 0.5)",
        boxShadow: "0 25px 50px rgba(0,0,0,0.4), 0 0 30px rgba(229,62,62,0.15)",
      }}
    >
      <div className="flex items-center gap-3 p-3">
        <div
          className="shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
          style={{ background: "var(--surface-3)" }}
        >
          <Image
            src={pokemon.sprite}
            alt={pokemon.name}
            width={40}
            height={40}
            className="w-10 h-10 object-contain drop-shadow-lg"
            priority
          />
        </div>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
            {pokemon.name}
          </h3>
          <div className="flex gap-1 mt-0.5">
            {pokemon.types.map((type: string) => (
              <span
                key={type}
                className={`px-1.5 py-0 rounded text-[0.55rem] font-semibold text-white ${TYPE_COLORS[type]}`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PokemonDragPreview;
