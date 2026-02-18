# Poke-Builder — Product Roadmap

> Last updated: February 2026
> Stack: Next.js 16, React 19, Hono, Prisma, PostgreSQL, Better Auth, Bun, Claude API

---

## Table of Contents

1. [Current State](#current-state)
2. [Tech Stack](#tech-stack)
3. [Pricing Tiers](#pricing-tiers)
4. [AI Features](#ai-features)
5. [Pre-Monetization Checklist](#pre-monetization-checklist)
6. [Phase Roadmap](#phase-roadmap)
7. [Hosting Costs by Phase](#hosting-costs-by-phase)
8. [Revenue Projections](#revenue-projections)
9. [Risks & Mitigations](#risks--mitigations)

---

## Current State

### What Is Built

| Feature | Status |
|---|---|
| Gen 1-5 team building (6 slots) | Done |
| Drag-and-drop reordering (desktop) | Done |
| Defensive type coverage heatmap | Done |
| Offensive type coverage heatmap | Done |
| Rule-based Smart Picks (5 roles) | Done |
| Undo / Redo (40 actions) | Done |
| Slot locking + replace mode | Done |
| Version exclusivity filtering | Done |
| Regional vs National dex toggle | Done |
| Cloud saves (auto-save, 1s debounce) | Done |
| Team sharing via URL | Done |
| Email / password auth (Better Auth) | Done |
| Settings panel | Done |
| Dark / light theme | Done |
| Privacy policy page | Done |
| SEO (robots, sitemap) | Done |

### What Is Missing (Gaps)

| Feature | Priority |
|---|---|
| Gen 6-9 support | Critical |
| Password reset flow | Critical |
| Email verification | Critical |
| Google + Discord OAuth | High |
| Mobile touch UX | High |
| Ability display on cards | High |
| Free tier save limits (currently unlimited) | High |
| Regional forms (Alolan, Galarian, etc.) | High |
| Terms of Service page | High |
| Move type coverage | Medium |
| Payment / subscription infrastructure | Needed before launch |

---

## Tech Stack

| Layer | Current | Additions Needed |
|---|---|---|
| Frontend | Next.js 16, React 19, Tailwind v4, Bun | — |
| Backend | Hono, Bun, Better Auth | Stripe / Lemon Squeezy |
| Database | PostgreSQL + Prisma | Redis (rate limiting, caching) |
| Auth | Better Auth (email/password) | Google + Discord OAuth |
| ORM | Prisma + Prisma Accelerate | — |
| Sprites / CDN | GitHub raw CDN | Cloudflare R2 (long-term) |
| Email | None | Resend or Postmark |
| Analytics | None | Plausible or Posthog |
| AI | None | Claude API (Anthropic) |
| Error tracking | None | Sentry |
| Logging | None | Axiom |
| Hosting | None yet | Vercel (frontend), Railway (backend) |

---

## Pricing Tiers

### Free (Guest — No Account)
- Gen 1-5 team building
- Defensive + offensive type coverage
- Rule-based Smart Picks
- Team sharing via URL
- 3 teams in localStorage only (no cloud)
- Basic settings panel

### Free (Registered Account)
- Everything above
- 5 cloud saved teams per generation
- Email / password auth
- Team history (last 30 days)

### Plus — $5.99/mo or $47/yr
- Gen 1-9 full support
- Unlimited cloud saved teams
- Ability display + filtering
- Move type coverage suggestions
- Regional forms (Alolan, Galarian, Hisuian, Paldean)
- Team export: Showdown! format, shareable image card
- Team side-by-side comparison
- AI Team Analyst (one-shot team summary)
- AI Team Chat — 30 messages per month
- AI Team Name Generator

### Pro — $12.99/mo or $99/yr
- Everything in Plus
- Unlimited AI Team Chat
- AI Draft Coach (guided step-by-step team building)
- AI Counter Scout (analyze opponent's team)
- AI Meta Insights (weekly format reports)
- AI Move Suggester (4-move sets per Pokemon)
- Competitive format support: VGC, Smogon OU/UU/RU/NU/PU
- EV spread optimizer
- Team archetype detection (HyperOffense, Balance, Stall, Weather)
- Personal API key (1,000 req/day)

### Team — $24.99/mo (5 seats)
- Pro features for up to 5 users
- Shared team workspace
- Commenting on team slots
- Draft mode for competitive team building sessions
- Team admin dashboard

---

## AI Features

### How AI Is Integrated

All AI features route through the backend to the Claude API (Anthropic). The team's JSON,
coverage data, and game context are passed as system context with prompt caching enabled.
This reduces cost by 60-80% on repeated requests for the same team.

```
User message
  → Backend: validate tier + message quota
  → Build prompt: system context (team JSON + coverage + game) + chat history
  → Call Claude API (Haiku for Plus, Sonnet for Pro)
  → Stream response back to client
  → Log usage to DB for quota tracking
```

### Feature Details

#### AI Team Analyst *(Plus+)*
One-shot natural language summary of your team's strengths, weaknesses, and notable threats.
Generated once per team save. Cached after first generation.

> *"Your team has a strong physical offensive core anchored by Garchomp and Machamp, but a
> critical Water/Ground double weakness. If your Rotom-W goes down early, opposing Kyogre
> or Landorus will sweep unchecked."*

#### AI Team Chat *(Plus: 30/mo, Pro: unlimited)*
Persistent chat window scoped to your current team. Ask anything:
- "What's my worst matchup?"
- "Should I replace Arcanine with Ninetales?"
- "What item should Gengar hold for this team?"

Model: claude-haiku-4-5 (Plus), claude-sonnet-4-5 (Pro)

#### AI Team Name Generator *(Plus+)*
Analyzes your team composition and generates 3-5 creative name options for your save slot.

> *"The Solar Brigade", "Kanto's Last Stand", "Six Feet Under"*

#### AI Draft Coach *(Pro only)*
Multi-turn guided team building. The AI asks questions about your playstyle, preferred roles,
and game format, then recommends each slot with reasoning — adapting as you lock picks in.

#### AI Counter Scout *(Pro only)*
Paste an opponent's team share link or import their team. Get a detailed scouting report:
which Pokemon threaten you, which of yours can win, and when to make the decisive play.

#### AI Meta Insights *(Pro only)*
Weekly digest of what's dominant in VGC and Smogon formats for your chosen game.
Flags threats your team needs to handle based on current usage statistics.

#### AI Move Suggester *(Pro only)*
Recommends a 4-move set for each Pokemon on your team, based on your team's coverage gaps
and the competitive format you're targeting.

#### Future AI Features (Phase 5+)
- **AI Team Narrator** — hype paragraph for content creators describing team lore + strategy
- **AI Image Card Generator** — stylized shareable team poster via image generation API
- **AI Tournament Prep** — bracket analysis, round-by-round strategic advice
- **AI Import Parser** — paste a Smogon paste or Reddit post, AI extracts the team

### AI Cost Per User (Estimated)

| Tier | Model | Messages | Est. AI Cost/User/Month |
|---|---|---|---|
| Plus | Haiku | 30 | ~$0.024 |
| Pro (avg) | Sonnet | ~100 | ~$0.30 |
| Pro (heavy) | Sonnet | ~500 | ~$1.50 |

At $12.99/mo Pro pricing, even heavy users generate strong margin. Rate limiting
(200 messages/day Pro cap) prevents abuse without impacting normal usage.

---

## Pre-Monetization Checklist

These must all be complete before launching any paid tier.
Do not ship subscriptions until every box is checked.

```
[ ] 1. Gen 6-9 support (Kalos, Alola, Galar, Paldea) + Fairy type
[ ] 2. Password reset flow via email (Resend)
[ ] 3. Email verification on signup
[ ] 4. Google + Discord OAuth (Better Auth supports this natively)
[ ] 5. Mobile layout fixes — touch-friendly team slots, bottom sheet UI
[ ] 6. Ability display on Pokemon cards and detail drawer
[ ] 7. Free tier cap: 5 cloud teams per generation (currently unlimited — fix before launch)
[ ] 8. Regional forms (Alolan, Galarian, Hisuian, Paldean)
[ ] 9. Terms of Service page
[ ] 10. Move type coverage (STAB-based at minimum)
```

### Why Each One Matters

| Item | Why It Blocks Launch |
|---|---|
| Gen 6-9 | 60%+ of players are on Gen 6+ games. Missing gens = immediate churn |
| Password reset | Users who forget passwords lose all saved teams permanently |
| Email verification | Required for trust and to prevent throwaway account abuse |
| OAuth | Email-only signup has high drop-off. Discord is where this community lives |
| Mobile | Large portion of Pokemon players are on mobile. Unusable = lost users |
| Ability display | Every competing tool shows abilities. Missing it signals incompleteness |
| Free tier cap | Currently all auth users get unlimited saves for free — must be set before paid tiers exist |
| Regional forms | Gen 7-8 feels incomplete without Alolan/Galarian forms |
| ToS | Legal requirement before processing any payments |
| Move coverage | Core utility feature. Absence is felt immediately |

---

## Phase Roadmap

---

### Phase 1 — Pre-Launch Foundation
**Timeline: Weeks 1-8**
**Goal: Fill all baseline gaps. No payments, no AI yet.**

#### Deliverables
- Gen 6-9 + Fairy type (Kalos, Alola, Galar, Paldea)
- Password reset + email verification via Resend
- Google + Discord OAuth via Better Auth
- Mobile layout — touch-friendly team slots, bottom sheet drawer
- Ability display on cards and Pokemon detail drawer
- Free tier cap: 5 teams per generation
- Regional forms: Alolan, Galarian, Hisuian, Paldean
- Move type coverage (STAB-based, matches existing coverage UI)
- Terms of Service page
- Update Privacy Policy to reflect current data collection

#### Success Metrics
- App works fully on mobile
- All 9 generations selectable
- New users can sign up with Google or Discord in under 30 seconds
- Password reset emails send and work reliably

---

### Phase 2 — Monetization Launch
**Timeline: Weeks 9-16**
**Goal: First paying users. Validate the pricing model.**

#### Deliverables
- Stripe integration (monthly + annual subscriptions, billing portal)
- Feature gating middleware in backend (tier checks on every protected route)
- Free tier limits enforced at API level
- Plus tier: Gen 6-9 unlock, unlimited saves, Showdown export, team image card
- Pro tier: VGC/Smogon filtering, EV optimizer, competitive formats, API key
- Upgrade prompts at natural friction points:
  - Hitting 5-team limit → "Upgrade to Plus for unlimited teams"
  - Trying to access Gen 7 → "Gen 7+ is a Plus feature"
- Annual plan with ~35-37% discount
- Referral link system (shareable link gives referrer 1 month free)
- Billing portal for managing/canceling subscriptions

#### Success Metrics
- 50+ paying users within 30 days of launch
- Less than 2% failed payments
- Churn rate below 10% monthly
- MRR: $300-$800

---

### Phase 3 — AI Integration
**Timeline: Weeks 17-28**
**Goal: AI as the Pro tier's core differentiator.**

#### Deliverables
- Claude API integration in backend (Anthropic SDK)
- Prompt caching for team context (60-80% cost reduction)
- Streaming response UI (tokens appear as they generate)
- Per-user message quota tracking in database
- AI Team Analyst (Plus+) — generated on team save
- AI Team Chat (Plus: 30/mo, Pro: unlimited) — streaming chat panel
- AI Team Name Generator (Plus+) — 3-5 options on demand
- AI Draft Coach (Pro) — multi-turn guided team building flow
- AI Counter Scout (Pro) — opponent team analysis
- Rate limiting: 200 AI messages/day Pro cap (abuse prevention)
- AI usage dashboard for users (messages used this month)

#### Success Metrics
- AI features used by 40%+ of Plus/Pro users monthly
- Average AI session 3+ messages (engagement signal)
- AI cost per Pro user stays below $2/month
- MRR: $2,000-$5,000

---

### Phase 4 — Scale & Community
**Timeline: Month 7-12**
**Goal: Organic growth engine. Community becomes a distribution channel.**

#### Deliverables
- Public team gallery (browse and upvote community teams)
- AI Meta Insights (Pro) — weekly format reports
- AI Move Suggester (Pro) — per-Pokemon move recommendations
- Discord bot — query teams, get AI analysis directly in Discord servers
- Team embed widget — shareable iframe for streamers and content creators
- Smogon tier filtering: OU / UU / RU / NU / PU
- Team archetype detection: HyperOffense, Balance, Stall, Weather, Trick Room
- Progressive Web App (PWA) — installable on mobile home screen
- Team workspaces (Team plan — 5 seats, $24.99/mo)
- Affiliate / ambassador program for Pokemon content creators

#### Success Metrics
- 20%+ of signups come from community team shares
- Discord bot installed in 100+ Pokemon servers
- Team plan adopted by competitive VGC teams and content creators
- MRR: $8,000-$15,000

---

### Phase 5 — Platform
**Timeline: Year 2+**
**Goal: The definitive Pokemon team building platform.**

#### Deliverables
- AI Team Narrator — lore + strategy writeup for content creators
- AI Image Card Generator — stylized shareable team poster (image generation API)
- AI Tournament Prep — bracket analysis and round-by-round advice
- Developer API (higher limits for Pro/Team, public docs, SDK)
- White-label offering for esports organizations and VGC teams
- Sponsorships from Pokemon content creators and competitive organizations
- Native mobile app (React Native, shared backend)
- AI fine-tuned on competitive Pokemon data for improved domain accuracy

#### Success Metrics
- App recognized by competitive Pokemon community as primary team building tool
- 3+ content creator sponsorships
- MRR: $35,000-$80,000

---

## Hosting Costs by Phase

### Phase 1 — Pre-Launch (~$5/mo)

| Service | Plan | Cost |
|---|---|---|
| Vercel | Hobby | $0 |
| Railway (backend) | Starter | $5 |
| Neon DB | Free tier | $0 |
| Resend (email) | Free (3k/mo) | $0 |
| **Total** | | **$5/mo** |

---

### Phase 2 — Monetization (~$63/mo)

| Service | Plan | Cost |
|---|---|---|
| Vercel | Pro | $20 |
| Railway (backend) | Pro | $15 |
| Neon DB | Launch | $19 |
| Resend | Starter | $0 |
| Plausible (analytics) | Growth | $9 |
| Stripe | 2.9% + $0.30/txn | Variable |
| **Total** | | **~$63/mo + Stripe fees** |

---

### Phase 3 — AI Integration (~$199-$269/mo)

| Service | Plan | Cost |
|---|---|---|
| Vercel | Pro | $20 |
| Railway (2 replicas) | Pro | $40 |
| Neon DB | Pro | $25 |
| Resend | Scale | $10 |
| Upstash Redis | Pay-as-you-go | $15 |
| Plausible | Growth | $9 |
| Sentry | Free | $0 |
| Claude API (est. 5k msg/day) | Pay-as-you-go | $80-$150 |
| **Total** | | **$199-$269/mo** |

**AI API Cost Detail:**

| Use Case | Model | Cost/msg | 5k msg/day |
|---|---|---|---|
| Plus chat | claude-haiku-4-5 | ~$0.0008 | ~$120/mo |
| Pro chat | claude-sonnet-4-5 | ~$0.003 | ~$450/mo |
| Team Analyst (cached) | claude-sonnet-4-5 | ~$0.001 | ~$30/mo |

*Prompt caching on static team context reduces real-world AI costs by 60-80%.*

---

### Phase 4 — Scale (~$656-$1,006/mo)

| Service | Plan | Cost |
|---|---|---|
| Vercel | Pro | $20 |
| Railway (multi-region) | Scale | $100-$200 |
| Neon DB | Scale | $50-$100 |
| Upstash Redis | Scale | $30 |
| Resend | Business | $20 |
| Cloudflare R2 (sprites/exports) | Pay-as-you-go | $10 |
| Claude API (~20k msg/day) | Pay-as-you-go | $400-$600 |
| Sentry | Team | $26 |
| **Total** | | **$656-$1,006/mo** |

---

### Phase 5 — Platform (~$3,600-$6,000/mo)

| Service | Plan | Cost |
|---|---|---|
| Vercel Enterprise or self-hosted | Enterprise | $400-$800 |
| Multi-region backend (Fly.io) | Scale | $300-$500 |
| Neon DB | Enterprise | $200 |
| Claude API (~100k msg/day) | Pay-as-you-go | $2,000-$3,500 |
| Image generation API | Pay-as-you-go | $500-$1,000 |
| Full infra (Redis, CDN, email, etc.) | — | $200-$500 |
| **Total** | | **$3,600-$6,000/mo** |

---

## Revenue Projections

### Conservative Model

| Phase | MAU | Registered | Plus Users | Pro Users | MRR |
|---|---|---|---|---|---|
| Launch (mo 1-3) | 2,000 | 200 | 20 | 5 | ~$150 |
| Early (mo 4-6) | 8,000 | 800 | 80 | 20 | ~$680 |
| AI Launch (mo 7-9) | 25,000 | 2,500 | 200 | 60 | ~$1,980 |
| Scale (mo 10-12) | 60,000 | 6,000 | 480 | 144 | ~$4,740 |
| Year 2 | 150,000 | 15,000 | 1,200 | 360 | ~$11,850 |
| Year 3 | 300,000 | 30,000 | 2,400 | 720 | ~$23,700 |

*Assumptions: 10% guest→registered, 8% registered→Plus, 3% registered→Pro*

### Optimistic Model (viral / strong SEO)

| Phase | MAU | MRR |
|---|---|---|
| Launch | 10,000 | $500 |
| Month 6 | 50,000 | $4,000 |
| Year 1 | 200,000 | $18,000 |
| Year 2 | 600,000 | $55,000 |

### Profit Snapshot (Conservative, Year 2)

```
MRR:              $11,850
Hosting costs:     $1,006
Stripe fees (~):     $350
Net profit/mo:   ~$10,500
Annual net:     ~$126,000
```

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Nintendo DMCA (sprites) | Medium | High | Use PokeAPI + GitHub sprite CDN (community-accepted). Avoid official game assets |
| PokeAPI rate limits at scale | Medium | Medium | Build-time data fetching (already done). Cache sprites on Cloudflare R2 |
| Low paid conversion | Medium | High | Free tier must be genuinely useful. Gate power features, not core utility |
| High AI cost from abuse | Low | Medium | Per-user daily message cap. Rate limiting at API level. Monitor cost dashboards |
| Subscription churn | Medium | Medium | Annual plan discounts, fast feature velocity, community building |
| Competition (Pokepast, Showdown) | High | Medium | Differentiate on UX + AI. Coverage analysis + Smart Picks are real advantages |
| Small addressable market | Low | High | Pokemon has 400M+ lifetime fans. Even 0.01% paying = $50k+ ARR |

---

## Key Insight

Your type coverage heatmap + Smart Picks recommendation engine is genuinely better than
anything freely available in this niche. That is your moat.

The path to monetization is straightforward:

1. Close the Gen 6-9 gap and auth gaps first (Phase 1)
2. Ship payments with clear feature gates (Phase 2)
3. Add AI as the Pro differentiator (Phase 3)
4. Let community sharing drive organic growth (Phase 4)

AI costs are favorable — even heavy Pro users cost less than $2/month in API fees at $12.99
pricing. The margin holds even at scale.

---

*Generated for poke-builder — February 2026*
