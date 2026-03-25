import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, ReactNode } from "react";
import { formatPokemonType, getPokemonTypeBadgeFallbacks, getPokemonTypePalette } from "@/lib/pokemonTypePalette";

type BadgeSize = "xs" | "sm" | "md";

function joinClassNames(parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function getTypeStyle(type: string): CSSProperties {
  const palette = getPokemonTypePalette(type);
  const fallbacks = getPokemonTypeBadgeFallbacks(type);

  return {
    ["--type-tint-dark" as string]: palette.darkTint,
    ["--type-tint-light" as string]: palette.lightTint,
    ["--type-bg-dark" as string]: fallbacks.darkBackground,
    ["--type-border-dark" as string]: fallbacks.darkBorder,
    ["--type-text-dark" as string]: fallbacks.darkText,
    ["--type-bg-light" as string]: fallbacks.lightBackground,
    ["--type-border-light" as string]: fallbacks.lightBorder,
    ["--type-text-light" as string]: fallbacks.lightText,
  };
}

interface PokemonTypeBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  pokemonType: string;
  size?: BadgeSize;
  hoverable?: boolean;
  uppercase?: boolean;
  children?: ReactNode;
}

export function PokemonTypeBadge({
  pokemonType,
  size = "sm",
  hoverable = false,
  uppercase = false,
  className,
  style,
  children,
  ...props
}: PokemonTypeBadgeProps) {
  return (
    <span
      {...props}
      className={joinClassNames([
        "pokemon-type-badge",
        `pokemon-type-badge--${size}`,
        hoverable && "pokemon-type-badge--hoverable",
        uppercase && "pokemon-type-badge--uppercase",
        className,
      ])}
      style={{ ...getTypeStyle(pokemonType), ...style }}
    >
      {children ?? formatPokemonType(pokemonType)}
    </span>
  );
}

interface PokemonTypeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  pokemonType: string;
  size?: BadgeSize;
  uppercase?: boolean;
  pressed?: boolean;
}

export function PokemonTypeButton({
  pokemonType,
  size = "sm",
  uppercase = false,
  pressed = false,
  className,
  style,
  children,
  ...props
}: PokemonTypeButtonProps) {
  return (
    <button
      {...props}
      type={props.type ?? "button"}
      aria-pressed={props["aria-pressed"] ?? pressed}
      data-pressed={pressed ? "true" : "false"}
      className={joinClassNames([
        "pokemon-type-badge",
        "pokemon-type-button",
        `pokemon-type-badge--${size}`,
        uppercase && "pokemon-type-badge--uppercase",
        className,
      ])}
      style={{ ...getTypeStyle(pokemonType), ...style }}
    >
      {children ?? formatPokemonType(pokemonType)}
    </button>
  );
}
