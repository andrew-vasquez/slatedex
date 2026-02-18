---
name: Security hardening
overview: "Add the three highest-value missing security controls: HTTP security headers on all Next.js responses, rate limiting on the public frontend API routes, and an allowlist for the `versionId` query parameter in the capture-guide route."
todos:
  - id: headers
    content: Add HTTP security headers to next.config.mjs (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS)
    status: pending
  - id: ratelimit-util
    content: Create frontend/lib/rate-limit.ts — shared in-memory sliding-window rate limiter
    status: pending
  - id: ratelimit-routes
    content: "Apply rate limiting to both frontend API routes (capture-guide: 30/min, pokemon-pools: 60/min)"
    status: pending
  - id: versionid-allowlist
    content: Add versionId allowlist to pokemon-capture-guide route
    status: pending
isProject: false
---

# Security Hardening Plan

## What's already solid

- Rate limiting on auth endpoints (5/15 min sign-in, 3/hr sign-up) and API routes (60/min)
- CORS with origin allowlist validation
- Secure + SameSite cookies in production via Better-auth
- Parameterized queries via Prisma (no SQL injection surface)
- Input validation with regex, length limits, and type allowlists on all profile/team fields
- Ownership checks on every data-mutating operation
- Generic error messages in production

## Gaps to fix

### 1. HTTP Security Headers — `next.config.mjs`

The biggest gap. No security headers are set on any frontend response. Add a `headers()` export to `[frontend/next.config.mjs](frontend/next.config.mjs)`:

```js
async headers() {
  return [
    {
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ],
    },
  ];
}
```

CSP is intentionally excluded here — the inline theme-init script and JSON-LD in `layout.tsx` require nonces, which is a separate, larger refactor.

### 2. Rate Limiting on Frontend API Routes

Both `[frontend/app/api/pokemon-capture-guide/route.ts](frontend/app/api/pokemon-capture-guide/route.ts)` and `[frontend/app/api/pokemon-pools/route.ts](frontend/app/api/pokemon-pools/route.ts)` are unprotected public routes that proxy to PokeAPI. Without rate limiting, a single client can cause cascading upstream abuse.

Add a small shared in-memory rate limiter at `[frontend/lib/rate-limit.ts](frontend/lib/rate-limit.ts)` (no Redis/external dependency needed at this scale):

```ts
// Sliding window, per-IP
const windows = new Map<string, number[]>();

export function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (windows.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) return false;
  hits.push(now);
  windows.set(ip, hits);
  return true;
}
```

Apply it in both route files using the `x-forwarded-for` / `x-real-ip` headers from the `Request`. Suggested limits: **30 requests per minute per IP** for capture-guide (heavy PokeAPI calls), **60/min** for pokemon-pools (cached data).

### 3. `versionId` Allowlist — Capture Guide Route

`[frontend/app/api/pokemon-capture-guide/route.ts](frontend/app/api/pokemon-capture-guide/route.ts)` accepts a free-form `versionId` string (only trimmed/lowercased) and passes it to PokeAPI. Add an explicit allowlist of valid version slugs to reject unknown values immediately:

```ts
const VALID_VERSION_IDS = new Set([
  "red", "blue", "yellow",
  "gold", "silver", "crystal",
  "ruby", "sapphire", "emerald", "firered", "leafgreen",
  "diamond", "pearl", "platinum", "heartgold", "soulsilver",
  "black", "white", "black-2", "white-2",
  // … etc
]);

if (!VALID_VERSION_IDS.has(versionId)) {
  return NextResponse.json({ error: "Unknown game version." }, { status: 400 });
}
```

### 4. (Minor) Backend Rate Limiter IP Key

`[backend/src/index.ts](backend/src/index.ts)` uses `x-forwarded-for.split(",")[0]` as the rate limit key. This can be trivially spoofed by a client setting their own `X-Forwarded-For` header. If the app is deployed behind Railway/Vercel (which sets this header), this is acceptable, but worth noting for future consideration.

## Summary of files changed

- `[frontend/next.config.mjs](frontend/next.config.mjs)` — add `headers()` with 5 security headers
- `[frontend/lib/rate-limit.ts](frontend/lib/rate-limit.ts)` — new shared in-memory rate limiter utility
- `[frontend/app/api/pokemon-capture-guide/route.ts](frontend/app/api/pokemon-capture-guide/route.ts)` — add rate limit check + versionId allowlist
- `[frontend/app/api/pokemon-pools/route.ts](frontend/app/api/pokemon-pools/route.ts)` — add rate limit check

