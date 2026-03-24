# Backend

## Required Environment Variables

- `DATABASE_URL`: Prisma runtime URL. Use `postgresql://...` / `postgres://...` locally (Bun) or `prisma://` / `prisma+postgres://` (Prisma Accelerate) on **Cloudflare Workers** (TCP `pg` is not used in the Worker bundle).
- `DIRECT_URL` (optional): Direct Postgres URL for migrations (`prisma migrate deploy`) and local dev consistency. If omitted, migrations fall back to `DATABASE_URL`.
- `FRONTEND_URL`: Frontend origin(s) for CORS and Better Auth trusted origins (comma-separated allowed).
- `BETTER_AUTH_URL`: Public base URL of this API (e.g. `https://api.example.com`).
- `BETTER_AUTH_SECRET`: Session secret (min 32 characters in production).
- `PORT` (optional): Bun server port; defaults to `3001` (ignored on Workers).
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
- `POSTHOG_API_KEY` (optional): PostHog project API key (HTTP capture from the Worker).
- `POSTHOG_HOST` (optional): PostHog ingest host. Defaults to `https://us.i.posthog.com`.

### Runtime DB selection (Bun / Node)

- In production, if `DATABASE_URL` is an Accelerate URL, runtime defaults to Accelerate when `PRISMA_RUNTIME_CONNECTION` is not `direct`.
- In non-production, runtime prefers `DIRECT_URL` for read-after-write consistency when set.
- **Cloudflare Workers** always use an Accelerate URL as `DATABASE_URL` (see `wrangler secret` below).

## Cloudflare Workers

1. Create a Prisma Accelerate connection string for your Postgres database and use it as Worker secret `DATABASE_URL`.
2. From `backend/`, set secrets (non-interactive CI uses `WRANGLER_LOG=stderr` and `wrangler secret put` with stdin):

   `DATABASE_URL`, `DIRECT_URL` (optional, not used at runtime on Workers), `FRONTEND_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `OPENAI_API_KEY` (if AI enabled), OAuth secrets if applicable, `POSTHOG_*` if used.

3. **Rate limiting:** Optionally create a KV namespace and add `kv_namespaces` with binding `RATE_LIMIT_KV` in `wrangler.jsonc`. Without KV, limits are in-memory per isolate (OK for low traffic).

4. Deploy:

   ```bash
   cd backend && bun install && bunx prisma generate && bun run worker:deploy
   ```

   **Cloudflare Workers Builds (dashboard):** set **Build command** to `bun run build` (TypeScript only). Do **not** use `bun build src/index.ts`: Prisma `runtime = "workerd"` uses `.wasm?module` imports Bun cannot bundle. Wrangler bundles the Worker on deploy.

   Dashboard **Deploy command** can stay `npx wrangler deploy` or use `bun run deploy` (same as `worker:deploy`). Per [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), the `[build]` block in `wrangler.jsonc` is **not** run by Workers Builds—only local `wrangler deploy` / `wrangler dev` use it (this repo runs `bun run build` before bundling locally).

5. Point the frontend `NEXT_PUBLIC_API_URL` at your Worker URL (scheme + host, no `/api` suffix).

**Deploy error `fileURLToPath` / `Received undefined` (code 10021):** The Prisma client is generated with `runtime = "workerd"` in `prisma/schema.prisma` so Cloudflare’s upload-time script check does not execute Node-style bootstrap that breaks when `import.meta.url` is missing. Run `bunx prisma generate` after pulling changes.

**Worker name mismatch:** `wrangler.jsonc` → `name` should match the Worker name in the Cloudflare dashboard (and what Workers Builds expects), or CI may override it and open a config PR.

### Railway → Workers env mapping

| Railway / Bun env   | Cloudflare                         |
| ------------------- | ---------------------------------- |
| Same variable names | `wrangler secret put <NAME>`       |
| `PORT`              | Not used (Workers HTTP)            |
| `NODE_ENV`          | Set via `wrangler.jsonc` `vars` or secret |

## Local development (Bun)

```bash
cd backend && bun install && bun run dev
```

Postinstall runs `prisma generate`. Use `DATABASE_URL` + `DIRECT_URL` as before for local Postgres.
