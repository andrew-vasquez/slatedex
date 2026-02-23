# Future Features

Potential features to add to the Pokémon Team Builder, grouped by impact.

---

## 🔥 High Value

### Team Export as Image
Generate a shareable team card graphic (PNG/SVG) with sprites, types, and stats — great for social media sharing.

### Moveset Builder
Add 4 moves per Pokémon with STAB indicators and coverage calculation against your selected moves (offensive coverage, not just defensive types).

### Community Teams Gallery
Browse and search public teams from other users. Filter by generation, rating, and popularity.

### Team Matchup Checker
Input an opponent's team (or gym leader / Elite Four), see who counters who with win/loss predictions per slot.

### Battle Planner — Visual Arena & Animations
**Recommendation: Keep on game page.** The Battle Planner is contextually tied to the team you're building. The arena/simulation should live as a **modal or expanded panel** within the Battle Planner tab — tap a matchup cell to "watch" it play out. No need to navigate away; keeps team context visible.

Improvements to make it fun and engaging (not just numbers):

1. **Battle Arena / Simulation Mode**
   - "Simulate Battle" or "Watch Matchup" — tap a matrix cell or assignment to play out the matchup visually.
   - Arena layout: two Pokémon facing each other (yours left, opponent right).
   - Use animated GIFs from Pokemon Showdown xyani sprites (`play.pokemonshowdown.com/sprites/xyani/{species}.gif`).
   - Attack animation: attacker sprite lunges toward defender; impact flash or shake on defender; type effectiveness badge ("Super effective!").
   - Outcome revealed after animation (win/loss/even).

2. **Micro-interactions**
   - Hover on matrix cells: sprites scale or bounce slightly.
   - Tap a matchup: brief "selected" glow before detail drawer.
   - Staggered reveal when Analyze completes (cells fade/slide in).
   - Pulse or highlight on recommended assignment cards.

3. **Visual Storytelling**
   - "Recommended order" flow: step-by-step (Your A vs Opp X → Win, Your B vs Opp Y → Win, etc.).
   - Team advantage progress bar based on `effectiveTotalScore`.
   - Type matchup diagram for selected matchup (attacker vs defender types, color-coded effectiveness).

4. **Sprite & Asset Upgrades**
   - Animated sprites in arena (Showdown xyani GIFs).
   - Back sprites for your team, front for opponent (in-game perspective).
   - Optional HP bars that shrink based on matchup score.

5. **Accessibility**
   - Respect `prefers-reduced-motion` and app `reduceMotion` setting.
   - "Quick results" toggle to skip or shorten animations.
   - Keep matrix/assignments as default for users who prefer data over visuals.

**Implementation order:** Phase 1 — Battle arena + animated sprites for single matchup (tap cell → play animation → show result). Phase 2 — Micro-interactions (hover, tap feedback, staggered reveals). Phase 3 — Recommended order flow and optional HP bars.

### Adventure Mode — Sprite RPG
A mini-game where users pick a starter, explore routes, encounter and battle wild Pokémon, challenge gyms for badges, and tackle the Elite 4 (presets from mainline games). Route: `/game/[generation]/adventure`. Reuse Battle Planner presets for gyms/Elite 4, type effectiveness engine, and PokeAPI data.

**Team Builder integration (why play the RPG):**
1. **Import from Adventure** — One-click import of current party into a new saved team. Team metadata: "Kanto run · 8 badges · Elite 4 cleared."
2. **"Prove it" challenge** — Build a team in Team Builder, run it through Adventure Mode. Beat Elite 4 → team gets a badge ("Elite 4 Cleared", "Champion") on the team card.
3. **Unlock cosmetics** — Beat gyms/Elite 4 to unlock avatar frames, profile badges, or team card styles for use across the app.
4. **Start from Adventure** — When creating a team, "Start from Adventure" pre-fills with current party for quick refinement.

**Art style:**
- **UI/chrome** — Match existing app: glass panels, dark theme, accent red, Chakra Petch / IBM Plex Sans. Adventure Mode feels like part of Slatedex, not a separate game.
- **Pokémon sprites** — Use existing assets: PokeAPI static sprites, Showdown xyani animated GIFs for battles. No custom sprite work.
- **World/maps** — Minimal illustration: nodes (towns, routes, gyms) connected by lines. SVG or CSS. Region icons, simple path visuals. Not full tile-based pixel art.
- **Battles** — Sprites in arena, HP bars, type badges. Clean, readable. Optional attack animations (sprite lunge, impact flash).
- **Tone** — Nostalgic but modern. "Contemporary take on classic" — consistent with the rest of the app.

**Implementation order:** Phase 1 — Starter pick, 1 route, wild encounters, simple battle, export to Team Builder. Phase 2 — 1–2 gyms, badges. Phase 3 — Full region, Elite 4. Phase 4 — "Prove it" challenge, unlock cosmetics.

### PWA / Installable App
Add a web app manifest and service worker so users can install to their home screen with full offline support.

---

## 🟡 Medium Value

### Nature & EV Planner
Pick natures and EV spreads per Pokémon, see how final stats change in real time.

### Team Templates
Pre-built starter teams (Rain, Sun, Trick Room, Balanced, etc.) users can load as a starting point and customize.

### Team Rating Score
Auto-score teams on type balance, BST distribution, and role coverage. Display a letter grade (S/A/B/C).

### Social Interactions
Like/favorite other users' public teams. Follow users to see their new teams in a feed.

### Nuzlocke Mode
Track encounters per route, enforce one catch per area, mark fainted Pokémon as dead. Dedicated UI for run tracking.

### Team Tags / Categories
Tag teams as "competitive", "casual", "nuzlocke", or "playthrough" for better organization and filtering.

---

## 🟢 Nice to Have

### Pokémon Showdown Import/Export
Parse Showdown paste format to auto-build teams, and export teams back to Showdown format.

### Team Changelog
Track edits over time — who was swapped in/out and when. View a timeline of team evolution.

### Multi-language Pokémon Names
Toggle between English, Japanese, French, and German names throughout the app.

### Held Item Planner
Assign items to Pokémon, see item conflicts (no duplicates in competitive formats).

### Team Notes
Add freeform notes per team or per slot — strategy reminders, EV spread notes, matchup tips.
