# Backend

## Required Environment Variables

- `DATABASE_URL`: Prisma runtime database URL. Supports either `postgresql://...` (Railway) or `prisma://...` (Prisma Accelerate).
- `DIRECT_URL` (optional): Direct database URL for Prisma migrations (`prisma migrate deploy`). If omitted, migrations fall back to `DATABASE_URL`.
- `FRONTEND_URL`: Frontend origin(s) used for CORS/auth trusted origins. You can pass a comma-separated list.
- `PORT` (optional): Server port; defaults to `3001`.
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

### Runtime DB selection

- In production, if `DATABASE_URL` is `prisma://...`, runtime defaults to Prisma Accelerate (even when `DIRECT_URL` is set).
- In non-production, runtime prefers `DIRECT_URL` for strongest read-after-write consistency.
- `DIRECT_URL` should be treated primarily as a migration/admin connection in hosted environments.

## Railway Notes

This service is configured to run directly from source in production:

- Start command: `bun run src/index.ts`
- Postinstall: `prisma generate`

Suggested Railway setup:

1. Set service root to `backend/`.
2. Set config file path to `/backend/railway.json` (or `/backend/nixpacks.toml`).
3. Use Bun runtime.
4. Set the environment variables above.
5. Add a migration command before deploy:
   - `prisma migrate deploy`

If Railway is still running `next build`, the service is building from repo root instead of `backend/`.
