import Image from "~/components/ui/AppImage";
import { pokemonSpriteSrc } from "@/lib/image";
import type { Pokemon } from "@/lib/types";

interface PokemonDragPreviewProps {
  pokemon: Pokemon;
}

const PokemonDragPreview = ({ pokemon }: PokemonDragPreviewProps) => {
  return (
    <div
      className="pointer-events-none relative flex h-18 w-18 items-center justify-center"
      style={{
        transform: "rotate(4deg) scale(1.06)",
        filter: "drop-shadow(0 18px 28px rgba(2, 6, 20, 0.32))",
      }}
      aria-hidden="true"
    >
      <div
        className="absolute inset-2 rounded-full"
        style={{
          background:
            "radial-gradient(circle, var(--version-color-soft, rgba(218, 44, 67, 0.2)) 0%, rgba(255,255,255,0.03) 48%, transparent 74%)",
          filter: "blur(10px)",
        }}
      />
      <div
        className="absolute inset-3 rounded-full"
        style={{
          border: "1px solid var(--version-color-border, rgba(218, 44, 67, 0.28))",
          background: "color-mix(in srgb, var(--surface-1) 84%, transparent)",
          backdropFilter: "blur(6px)",
        }}
      />
      <Image
        src={pokemonSpriteSrc(pokemon.sprite, pokemon.id)}
        alt={pokemon.name}
        width={72}
        height={72}
        unoptimized
        priority
        className="relative h-16 w-16 object-contain pixelated"
        style={{
          filter: "drop-shadow(0 10px 16px rgba(2, 6, 20, 0.3))",
        }}
      />
    </div>
  );
};

export default PokemonDragPreview;
