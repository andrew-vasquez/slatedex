# Backend

## Required Environment Variables

- `DATABASE_URL`: Prisma runtime URL. For Railway, use your Postgres connection string (`postgresql://...` / `postgres://...`). Prisma Accelerate URLs are still supported if you want them.
- `DIRECT_URL` (optional): Direct Postgres URL for migrations (`prisma migrate deploy`) and local dev consistency. If omitted, migrations fall back to `DATABASE_URL`.
- `FRONTEND_URL`: Frontend origin(s) for CORS and Better Auth trusted origins (comma-separated allowed).
- `BETTER_AUTH_URL`: Public base URL of this API (e.g. `https://api.example.com`).
- `BETTER_AUTH_SECRET`: Session secret (min 32 characters in production).
- `PORT` (optional): Bun server port; defaults to `3001`. Railway injects this automatically.
- `PRISMA_RUNTIME_CONNECTION` (optional): Force runtime DB mode. Allowed values: `accelerate` or `direct`.
- `ENABLE_AI_COACH` (optional): Enable AI chat/analysis endpoints. Defaults to `true`.
- `OPENAI_API_KEY` (required when AI is enabled in production): OpenAI API key for chat completions.
- `OPENAI_MODEL` (optional): Global fallback model for AI coach requests. Defaults to `gpt-4o-mini`.
- `OPENAI_MODEL_CHAT` (optional): Chat-specific model. Defaults to `gpt-4o-mini` (or `OPENAI_MODEL` if set).
- `OPENAI_MODEL_ANALYZE` (optional): Analyze-specific model. Defaults to `gpt-4.1-mini` (or `OPENAI_MODEL` if set).
- `AI_REQUEST_TIMEOUT_MS` (optional): Timeout per AI request in milliseconds. Defaults to `30000`.
- `AI_MAX_OUTPUT_TOKENS` (optional): Global fallback max completion tokens. Defaults to `700`.
- `AI_MAX_OUTPUT_TOKENS_CHAT` (optional): Chat max completion tokens. Defaults to `420` (or `AI_MAX_OUTPUT_TOKENS` if set).
- `AI_MAX_OUTPUT_TOKENS_ANALYZE` (optional): Analyze max completion tokens. Defaults to `560` (or `AI_MAX_OUTPUT_TOKENS` if set).
- `POSTHOG_API_KEY` (optional): PostHog project API key.
- `POSTHOG_HOST` (optional): PostHog ingest host. Defaults to `https://us.i.posthog.com`.

## Railway Hosting

Railway is a good fit for this backend as it exists today:

- The app already runs as a long-lived Bun HTTP server via `src/index.ts`.
- It binds to `PORT`, which Railway provides automatically.
- Prisma uses direct Postgres connections cleanly in this runtime.
- `GET /healthz` is available for health checks.
- Build and start are driven by the Bun package scripts, which Railway can run under Railpack.

### Recommended Railway setup

1. Create a Railway service with `backend/` as the root directory.
2. Attach a PostgreSQL database, then set these service variables:

   `DATABASE_URL`, `DIRECT_URL` (optional), `FRONTEND_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `OPENAI_API_KEY` (if AI enabled), OAuth secrets if applicable, `POSTHOG_*` if used.

3. Use these commands if you want to override Railway defaults:

   Build command: `bun run build`
   Start command: `bun run start`
   Pre-deploy command (recommended): `bun run migrate:deploy`

   Builder: Railpack

4. Set the Railway health check path to `/healthz`.

5. Point the frontend `NEXT_PUBLIC_API_URL` at the Railway backend URL (scheme + host, no `/api` suffix).

### Runtime DB selection (Bun / Node)

- In production, if `DATABASE_URL` is an Accelerate URL, runtime defaults to Accelerate when `PRISMA_RUNTIME_CONNECTION` is not `direct`.
- In non-production, runtime prefers `DIRECT_URL` for read-after-write consistency when set.
- On Railway, a normal Postgres `DATABASE_URL` is the simplest default and is what this service now builds for.

### Rate limiting on Railway

- Current rate limiting is in-memory.
- That is fine for a single Railway instance or low traffic.
- If you scale horizontally, move rate limiting to a shared store such as Redis or Postgres-backed counters.

## Local development (Bun)

```bash
cd backend && bun install && bun run dev
```

Postinstall runs `prisma generate`. Use `DATABASE_URL` + `DIRECT_URL` as before for local Postgres.
