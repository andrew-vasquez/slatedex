# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Layout

Monorepo with two top-level directories:

- `frontend/` — Next.js 16 App Router (React 19, Tailwind CSS v4, Bun)
- `backend/` — Hono API server (Prisma, Better Auth, Bun)

## Commands

### Frontend

```bash
cd frontend
bun run dev        # Start Next.js dev server (Turbopack)
bun run build      # Production build (fetches PokeAPI data at build time)
bun run start      # Serve production build
bun run lint       # ESLint
bunx tsc --noEmit  # TypeScript type check
```

### Backend

```bash
cd backend
bun run dev        # Start Hono dev server (hot reload)
bun run build      # Build for production
bun run start      # Run production build
```

No test framework is configured.

## Architecture

Pokemon team builder using Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, and Bun.

### Data Flow

- **`/`** renders `GameSelector` — picks from 5 mainline games (Gens 1-5).
- **`/game/[gameId]`** is an RSC page that fetches Pokemon data server-side via `frontend/lib/pokeapi.ts`, then passes `PokemonPools` as props to the client `TeamBuilder`. Pages are statically generated via `generateStaticParams`.

`frontend/lib/pokeapi.ts` fetches from PokeAPI using `pokedex-promise-v2` at build time. It batches requests (50 per `Promise.all`), resolves evolution chains, type history, and regional dex membership. Results are cached in in-memory Maps.

### Client State

Team state lives in `TeamBuilder` via `useState` + `localStorage`. Keys are versioned: `team_game_{id}_v1`, `selected_version_game_{id}_v1`, `version_filter_game_{id}_v1`. No external state management library.

### Component Relationships

`TeamBuilder` is the orchestrator — provides `@dnd-kit` `DndContext`, manages the 6-slot team array, search/filter state, and version exclusivity filtering. It renders:

- `PokemonSelection` — scrollable list with search, dex mode toggle (regional/national), version filter. Uses `useDeferredValue` for search and memoized filtering.
- `TeamPanel` / `TeamSlot` — droppable team slots.
- `DefensiveCoverage` — dynamically imported (`next/dynamic`), only loads when team has members. Type coverage heatmap.
- `TeamRecommendations` — scores final-evolution Pokemon by how well they patch team weaknesses.

### Type Analysis System

`frontend/lib/constants.ts` has `TYPE_EFFECTIVENESS` and `TYPE_RESISTANCES` for all 18 types. `frontend/lib/teamAnalysis.ts` computes a `CoverageMap` (per-type weakness/resistance counts). This powers both the DefensiveCoverage heatmap and Smart Picks scoring.

### Version Exclusivity

`frontend/lib/versionExclusives.ts` has curated exclusive Pokemon lists per game (Gens 1-5), falling back to PokeAPI `game_indices`. Pokemon get an `exclusiveStatus` of "exclusive", "shared", or "unknown".

## Conventions

- `"use client"` on all interactive components; RSC only for pages/layout.
- Shared types in `frontend/lib/types.ts` (`Pokemon`, `Game`, `PokemonPools`, `CoverageMap`).
- `@/*` path alias maps to `frontend/` root.
- `next/image` for sprites; remote patterns for `raw.githubusercontent.com`.
- Design tokens (colors, surfaces, glass effects) as CSS variables in `frontend/app/globals.css`. Dark theme default; light via `[data-theme="light"]`.
- Custom classes in `globals.css`: `.glass`, `.panel`, `.btn-secondary`, `.btn-danger`, `.skeleton`.
- Fonts: Chakra Petch (display), IBM Plex Sans (body), JetBrains Mono (stats/IDs).
