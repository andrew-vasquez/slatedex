# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Scope

**Pokémon support:** Generations 1–9, all Pokémon. The app uses PokeAPI for species data and supports all mainline games from Red/Blue/Yellow through Scarlet/Violet. Team building, type coverage, and recommendations work for all generations. Some features (e.g. Battle Planner presets, curated version exclusives) have more detailed data for earlier generations; newer gens use PokeAPI fallbacks where needed.

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

Pokemon team builder with authentication, AI coaching, and battle planning. Stack: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, Hono, Prisma, Better Auth, Bun.

### Routes

| Route | Type | Description |
|---|---|---|
| `/` | RSC | Landing page (hero, features, CTAs) |
| `/play` | RSC | Game selector — picks generation/version |
| `/game/[generation]` | RSC | Main team builder page (slug: gen1, gen2, … gen9) |
| `/teams` | Client | Saved teams gallery |
| `/u/[username]` | RSC | Public profile page |
| `/login` / `/signup` | Client | Auth pages (Better Auth) |
| `/auth` | — | Auth callback |
| `/settings` | Client | User settings |
| `/settings/profile` | Client | Avatar, bio, favorites |
| `/settings/admin` | Client | Role/plan management (admin only) |
| `/privacy` / `/terms` | RSC | Legal pages |

### Data Flow

- `/play` renders `GameSelector` for picking generation and game version.
- `/game/[generation]` is an RSC page that fetches Pokemon data server-side via `frontend/lib/pokeapi.ts`, then passes `PokemonPools` as props to the client `TeamBuilder`. Pages are statically generated via `generateStaticParams`.

`frontend/lib/pokeapi.ts` fetches from PokeAPI using `pokedex-promise-v2` at build time. It batches requests (50 per `Promise.all`), resolves evolution chains, type history, and regional dex membership. Results are cached in in-memory Maps.

### Client State

Team state lives in `TeamBuilder` via `useState` + `localStorage`. Keys are versioned (see `frontend/lib/storageKeys.ts`). No external state management library.

### Component Relationships

`TeamBuilder` (`app/game/TeamBuilder.tsx`) is the orchestrator — provides `@dnd-kit` `DndContext`, manages the 6-slot team array, search/filter state, version exclusivity filtering, and undo history. Dynamically imports heavy panels.

**Selection & Slots:**
- `PokemonSelection` — scrollable list with search, dex mode toggle (regional/national), version filter. Uses `useDeferredValue` and memoized filtering.
- `TeamPanel` / `TeamSlot` — droppable team slots.
- `PokemonCard` — card in the selection list (type icons, stats, exclusivity badge).

**Type Coverage:**
- `DefensiveCoverage` — type weakness/resistance heatmap (dynamic import).
- `OffensiveCoverage` — STAB coverage matrix showing which types each team member hits.
- `TeamRecommendations` — scores final-evolution Pokemon by how well they patch team gaps.

**AI Coach** (`app/game/AiCoachPanel.tsx`):
- Chat and full team analysis modes via OpenAI.
- Tracks gym checkpoint progress (`AiCheckpointSelector`).
- Message history persisted to backend. Monthly quota (FREE: 50/month, PRO: unlimited).

**Battle Planner** (`app/game/battle/`):
- `BattlePlannerTab` — orchestrates opponent team creation and matchup analysis.
- `BossPresetPicker` — select from gym leader / Elite Four / champion presets (all gens).
- `OpponentTeamEditor` — manually build opponent teams.
- `MatchupMatrix` / `MatchupAssignments` — visual win/loss/even predictions.
- `SavedOpponentTeamsPanel` — list and delete saved opponent teams.
- Supports strict (realistic level caps) and sandbox modes.
- Battle Planner presets (gym leaders, Elite Four, champions) are fully implemented for Gen 3 Hoenn; presets exist for Gens 1–5. Other gens use manual opponent or saved teams.

**Other panels:**
- `TeamCaptureGuide` — step-by-step catchability guide for each team member.
- `SavedTeamsPanel` — quick load/delete sidebar.
- `TeamToolsModal` — import/export/share/saved teams tabs.
- `PokemonDetailDrawer` — stats, abilities, evolution chain.
- `BuilderSettingsPanel` — dex mode, card density, haptics preferences.
- `CommandPalette` — Cmd+K global search.
- `OnboardingTour` — guided walkthrough for new users.
- `MobileTeamSheet` — mobile bottom sheet for team management.

**Hooks** (`app/game/hooks/`):
- `useTeamPersistence` — saves/loads team from localStorage.
- `useBuilderSettings` — builder preferences.
- `useToast` — toast notification context.
- `useAnimatedUnmount` — animated exit transitions.

### Type Analysis System

`frontend/lib/constants.ts` has `TYPE_EFFECTIVENESS` and `TYPE_RESISTANCES` for all 18 types. `frontend/lib/teamAnalysis.ts` computes `CoverageMap` and `OffensiveCoverageMap`. This powers both coverage heatmaps and Smart Picks scoring.

### Version Exclusivity

`frontend/lib/versionExclusives.ts` has curated exclusive Pokemon lists for selected games (Gens 1–5), falling back to PokeAPI `game_indices` for others. Pokemon get an `exclusiveStatus` of `"exclusive"`, `"shared"`, or `"unknown"`. App supports all games Gen 1–9.

### Frontend API Client

`frontend/lib/api.ts` wraps all backend calls:
- Teams: `fetchTeams`, `createTeam`, `updateTeam`, `deleteTeam`
- AI: `fetchAiMessages`, `sendAiChat`, `analyzeAiTeam`
- Battle: `fetchBattlePresets`, `analyzeBattleMatchups`, `fetchOpponentTeams`, `createOpponentTeam`, `updateOpponentTeam`, `deleteOpponentTeam`
- Profiles: `fetchProfile`, `updateProfile`

### Authentication

Better Auth with username plugin. Auth client in `frontend/lib/auth-client.ts`. AuthProvider context wraps the app. Username rules: 3–30 chars, lowercase/underscore, max 2 changes per 30 days.

User roles: `USER`, `ADMIN`, `OWNER`. Plans: `FREE`, `PRO`.

## Backend

### Routes

```
POST   /api/auth/*                          # Better Auth
GET    /api/teams                           # List user teams
POST   /api/teams                           # Create team
GET    /api/teams/:id
PUT    /api/teams/:id
DELETE /api/teams/:id
GET    /api/profiles/me                     # Current user profile + AI usage
GET    /api/profiles/:username              # Public profile
PATCH  /api/profiles/me
POST   /api/profiles/me/username            # Change username (rate limited)
POST   /api/ai/chat                         # AI coach chat (quota tracked)
POST   /api/ai/analyze                      # Full team analysis (quota tracked)
GET    /api/ai/messages/:teamId             # Message history
GET    /api/ai/usage                        # Monthly usage snapshot
GET    /api/battle/presets/:gen/:gameId     # Boss presets
POST   /api/battle/analyze                  # Matchup analysis
GET    /api/battle/opponent-teams
POST   /api/battle/opponent-teams
PUT    /api/battle/opponent-teams/:id
DELETE /api/battle/opponent-teams/:id
```

All routes except auth require the `authMiddleware` (`src/middleware/auth.ts`).

### Key Backend Lib Files

- `src/lib/auth.ts` — Better Auth setup with Prisma adapter and username plugin.
- `src/lib/ai/openai.ts` — OpenAI integration.
- `src/lib/ai/prompts.ts` — System/user prompt builders with team context.
- `src/lib/ai/context.ts` — Team context payload construction.
- `src/lib/ai/bossData.ts` — Boss weakness/type guidance per checkpoint.
- `src/lib/ai/quota.ts` — Monthly usage tracking with period rollover.
- `src/lib/battle/presetRosters.ts` — Curated boss teams for Gens 1–5 (gym leaders, Elite Four, champions). Battle Planner supports all gens via manual/saved teams.
- `src/lib/battle/matchupEngine.ts` — Type effectiveness win/loss/even predictions.
- `src/lib/battle/progressionRules.ts` — Level cap constraints per gym order; realism validation.
- `src/lib/posthog.ts` — PostHog event tracking.

### Database Models (Prisma / PostgreSQL)

- `User` — username, email, role (`USER`/`ADMIN`/`OWNER`), plan (`FREE`/`PRO`), AI quotas.
- `Profile` — bio, avatarUrl, avatarFrame, favoriteTeamId, favoriteGameIds, favoritePokemonNames.
- `Team` — name, generation, gameId, selectedVersionId, checkpoint fields, pokemon (JSON).
- `OpponentTeam` — source (`MANUAL`/`PRESET`), presetBossKey, pokemon (JSON), notes.
- `AiConversation` — one per (user, team) pair.
- `AiMessage` — role (`USER`/`ASSISTANT`/`SYSTEM_EVENT`), kind (`CHAT`/`ANALYSIS`), content.
- `AiMonthlyUsage` — chatCount, analyzeCount per user per monthly period.
- `Session`, `Account`, `Verification` — Better Auth standard.

## Conventions

- `"use client"` on all interactive components; RSC only for pages/layout.
- Shared types in `frontend/lib/types.ts` (`Pokemon`, `Game`, `PokemonPools`, `CoverageMap`, `OffensiveCoverageMap`, `BuilderSettings`, `MatchupPrediction`, `BattleCheckpoint`, `OpponentTeamSource`).
- Generation metadata (games, versions, helper functions) in `frontend/lib/pokemon.ts` — `GENERATION_META`, `ALL_GAMES`, `getVersionLabel()`.
- `@/*` path alias maps to `frontend/` root.
- `next/image` for sprites; remote patterns for `raw.githubusercontent.com` and OAuth avatar hosts.
- Design tokens (colors, surfaces, glass effects) as CSS variables in `frontend/app/globals.css`. Dark theme default; light via `[data-theme="light"]`.
- Custom classes in `globals.css`: `.glass`, `.panel`, `.btn-secondary`, `.btn-danger`, `.skeleton`.
- Fonts: Chakra Petch (display), IBM Plex Sans (body), JetBrains Mono (stats/IDs).
- Use `react-icons` (Fi prefix for Feather icons) for iconography.
- Heavy panels in `TeamBuilder` are dynamically imported with `next/dynamic` (`ssr: false` for AI/battle panels).
