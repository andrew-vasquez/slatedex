# Copilot Instructions — Pokémon Team Builder

## Build & Dev Commands

```bash
bun run dev       # Start Next.js dev server (Turbopack)
bun run build     # Production build (fetches PokeAPI data at build time)
bun run start     # Serve production build
bun run lint      # ESLint
bunx tsc --noEmit # TypeScript type check (no emit)
```

No test framework is configured.

## Architecture

Next.js 16 App Router (TypeScript) with React Server Components:

- `/` — `app/page.tsx` (RSC) → renders `GameSelector` (client component, game picker)
- `/game/[gameId]` — `app/game/[gameId]/page.tsx` (RSC) → fetches Pokémon data server-side via PokeAPI, renders `TeamBuilder` (client component)

### Data Flow

Pokémon data is fetched from **PokeAPI** via `pokedex-promise-v2` at build time in the RSC page component (`generateStaticParams`). Data is passed as serialized props to the client `TeamBuilder`. Game pages use **SSG** with `generateStaticParams`.

Team state lives entirely client-side in `TeamBuilder` using `useState` + `localStorage` (versioned with `STORAGE_VERSION`, key format `team_game_{id}_v1`).

### File Structure

```
app/
├── layout.tsx              # Root layout (RSC), metadata API, JSON-LD
├── globals.css             # Tailwind v4 + custom styles
├── page.tsx                # Home — renders GameSelector
└── game/[gameId]/
    ├── page.tsx            # RSC — fetches PokeAPI, renders TeamBuilder
    └── loading.tsx         # Loading skeleton

components/
├── game/GameSelector.tsx   # "use client" — game picker with next/link
├── team/
│   ├── TeamBuilder.tsx     # "use client" — orchestrator, DnD context, state
│   ├── TeamBuilderHeader.tsx
│   ├── TeamPanel.tsx
│   ├── PokemonSelection.tsx
│   ├── TeamSlot.tsx
│   └── DefensiveCoverage.tsx  # Dynamically imported (next/dynamic)
└── ui/
    ├── PokemonCard.tsx     # "use client" — draggable card with next/image
    └── PokemonDragPreview.tsx

lib/
├── types.ts                # Shared TypeScript interfaces (Pokemon, Game, CoverageMap)
├── constants.ts            # TYPE_EFFECTIVENESS, TYPE_RESISTANCES, TYPE_COLORS, ALL_TYPES
├── pokeapi.ts              # Server-only — PokeAPI fetcher with Promise.all batching
├── pokemon.ts              # MAINLINE_GAMES metadata
└── teamAnalysis.ts         # getTeamDefensiveCoverage()
```

## Conventions

- **TypeScript** throughout. Shared types in `lib/types.ts`.
- **All interactive components** use `"use client"` directive. RSC is only used for pages/layout.
- **Tailwind CSS v4** via `@tailwindcss/postcss`. Custom classes (`btn-secondary`, `btn-danger`) in `app/globals.css`.
- **next/image** for all Pokémon sprites. Remote patterns configured for `raw.githubusercontent.com`.
- **@dnd-kit** for drag-and-drop. `TeamBuilder` is the DnD context provider.
- **Path aliases**: `@/*` maps to project root via `tsconfig.json`.
- **DefensiveCoverage** is dynamically imported (only loaded when team has members).
- **localStorage** is versioned (`_v1` suffix) with a centralized `persistTeam` helper.
- **Bun** as the package manager and runtime (`bun.lock`).
