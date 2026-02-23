# Repository Guidelines

## Scope

Pokémon team builder supporting **Generations 1–9** and **all Pokémon**. Games from Red/Blue/Yellow through Scarlet/Violet. PokeAPI provides species data; some features (Battle Planner presets, version exclusives) have curated data for earlier gens with fallbacks for newer ones.

## Project Structure & Module Organization

Monorepo with two top-level directories:

### Frontend (`frontend/`)
- `frontend/app/`: Next.js App Router entry points and global app shells.
- `frontend/components/`: UI grouped by feature:
  - `frontend/components/game/` for game/version selectors.
  - `frontend/components/team/` for team builder, coverage, and recommendations.
  - `frontend/components/ui/` for reusable cards, menus, and shared controls.
- `frontend/lib/`: data and domain logic (`pokeapi.ts`, `teamAnalysis.ts`, `versionExclusives.ts`, `types.ts`).
- `frontend/hooks/`: React hooks (`useTeamPersistence.ts`, `useBuilderSettings.ts`).
- `frontend/public/`: static assets.

Example routes: `frontend/app/page.tsx` (home) and `frontend/app/game/[generation]/page.tsx` (team builder).

### Backend (`backend/`)
- `backend/src/`: Hono API server source code.
- `backend/prisma/`: Prisma schema and migrations.

## Build, Test, and Development Commands

### Frontend
- `cd frontend && bun run dev`: start local development server.
- `cd frontend && bun run build`: create production build.
- `cd frontend && bun run start`: run the production server.
- `cd frontend && bun run lint`: run ESLint via Next.js config.
- `cd frontend && bunx tsc --noEmit --incremental false`: full type-check pass before PRs.

### Backend
- `cd backend && bun run dev`: start Hono dev server with hot reload.
- `cd backend && bun run build`: build for production.
- `cd backend && bun run start`: run the production build.

## Coding Style & Naming Conventions
- Use TypeScript and React function components.
- Follow existing formatting: 2-space indentation and consistent Tailwind class grouping.
- Naming:
  - Components/files: `PascalCase` (e.g., `PokemonCard.tsx`).
  - Variables/functions/hooks: `camelCase` (e.g., `useSelectedVersion`).
  - Constants: `UPPER_SNAKE_CASE`.
- Keep server/client rendering deterministic; avoid hydration-unstable render logic.

## Testing Guidelines
- No dedicated unit test framework is configured yet.
- Minimum validation before merging:
  - `cd frontend && bunx tsc --noEmit --incremental false`
  - `cd frontend && bun run lint`
  - `cd frontend && bun run build` for rendering/data-flow changes
  - Manual checks for game selection, dex mode, version filtering, and team add/remove flows.
- If adding tests, use `*.test.ts`/`*.test.tsx` naming and colocate with the feature or in `__tests__/`.

## Commit & Pull Request Guidelines
- Match current history style: imperative, descriptive commit subjects (e.g., `Refactor TeamBuilder state handling`).
- Keep commits scoped to one concern (UI, data, performance, bugfix).
- PR checklist:
  - Clear summary and rationale.
  - Linked issue/task (if applicable).
  - Validation notes (`lint`, `typecheck`, `build`, manual QA).
  - Screenshots/video for UI changes.
