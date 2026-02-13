# Poke-Builder Roadmap

Ideas for features, UX improvements, and UI polish.

---

## Features

### High Impact

- [ ] **Offensive Coverage Analysis** — Show which types the team can hit super-effectively, revealing blind spots in attacking options. `TYPE_EFFECTIVENESS` data already exists.
- [ ] **Full Stat Display (SpA/SpD/Speed)** — Only HP/ATK/DEF are shown currently. Full stats help users build more informed teams (e.g. spotting a slow team).
- [ ] **Abilities Display** — Abilities like Levitate, Thick Fat, or Wonder Guard change defensive matchups. Show them on cards.
- [ ] **Share/Export Team** — Generate a shareable URL or clipboard-copyable text (Showdown format is the community standard).

### Medium Impact

- [ ] **Evolution Chain Viewer** — Show a mini evolution line on each card or in a detail panel. `evolves_from_species` is already fetched; pull the full chain.
- [ ] **Legendary/Mythical Badges** — PokeAPI has `is_legendary`/`is_mythical` flags. Mark these on cards.
- [ ] **Move Coverage Suggestions** — For each team member, suggest moves that cover the team's offensive gaps. Natural extension of Smart Picks.
- [ ] **Gens 6-9 Full Support** — Metadata exists in `pokemon.ts` for all 9 gens. Complete wiring for later gens to expand the audience.

### Nice to Have

- [ ] **Pokedex Flavor Text** — Show the dex entry on hover/tap in a detail view. Adds personality.
- [ ] **Regional Forms** — Alolan/Galarian/Hisuian/Paldean forms have different types and stats. Important for accurate team building in later gens.
- [ ] **Compare Mode** — Side-by-side stat comparison of 2-3 Pokemon when deciding who to add.

---

## UX

- [ ] **Pokemon Detail Drawer/Modal** — Tapping a card currently just adds it. A detail view (slide-up sheet on mobile, side panel on desktop) showing full stats, abilities, dex entry, and evolution chain lets users decide before committing.
- [ ] **Undo Last Action** — A toast ("Removed Charizard — Undo") with a ~5 second window after removing or clearing.
- [ ] **Team Slot Reordering** — Drag between team slots to reorder. Lead Pokemon matters in-game.
- [ ] **Filter by Type** — Let users filter the Pokemon list by type (e.g. "show me all Water types"). Useful when Smart Picks says you need Water coverage.
- [ ] **Keyboard Shortcuts** — `Ctrl+Z` undo, `/` to focus search, `Esc` to clear search, `1-6` to remove from slots.
- [ ] **Onboarding Hints** — First-time users might not discover Smart Picks, dex toggle, or version filtering. Subtle pulsing dot or one-time tooltip on these controls.
- [ ] **Empty State Guidance** — When the team is empty, show a prompt like "Add your first Pokemon to see type analysis" instead of hiding panels.

---

## UI

- [ ] **Add/Remove Animations** — Card flies to slot on add, slot pops in, removed card fades out. Makes it feel game-like.
- [ ] **Stat Bar Gradients** — Color-gradient bars that shift red (low) to yellow to green (high) based on stat value. Show numeric value on hover.
- [ ] **Type Icons** — Use official Pokemon type SVG icons alongside or instead of text labels for faster recognition.
- [ ] **Team Complete Celebration** — Subtle confetti or animation when filling all 6 slots.
- [ ] **Coverage Heatmap Legend** — Small legend explaining colors/numbers for new users.
- [ ] **Mobile Bottom Sheet for Team** — Sticky bottom bar with 6 team slot circles, swipe-up to expand. Keeps the Pokemon list front and center.
- [ ] **Higher Quality Sprites** — Use `sprites.other.official-artwork` for detail view or team panel for a premium feel.
- [ ] **Skeleton Loading Polish** — Match card layout (type badge placeholders, stat bar shapes) rather than generic rectangles.
- [ ] **Generation-Themed Accents** — Carry region colors from GameSelector through to the team builder page (header tint, accent color) so each gen feels distinct.
