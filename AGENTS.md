# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router entry points and global app shells.
- `components/`: UI grouped by feature:
  - `components/game/` for game/version selectors.
  - `components/team/` for team builder, coverage, and recommendations.
  - `components/ui/` for reusable cards, menus, and shared controls.
- `lib/`: data and domain logic (`pokeapi.ts`, `teamAnalysis.ts`, `versionExclusives.ts`, `types.ts`).
- `public/`: static assets.

Example routes: `app/page.tsx` (home) and `app/game/[gameId]/page.tsx` (team builder).

## Build, Test, and Development Commands
- `npm run dev`: start local development server.
- `npm run build`: create production build.
- `npm run start`: run the production server.
- `npm run lint`: run ESLint via Next.js config.
- `npx tsc --noEmit --incremental false`: full type-check pass before PRs.

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
  - `npx tsc --noEmit --incremental false`
  - `npm run lint`
  - `npm run build` for rendering/data-flow changes
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
