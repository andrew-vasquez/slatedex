# Backend

## Required Environment Variables

- `DATABASE_URL`: Prisma runtime database URL. Supports either `postgresql://...` (Railway) or `prisma://...` (Prisma Accelerate).
- `DIRECT_URL` (optional): Direct database URL for Prisma migrations (`prisma migrate deploy`). If omitted, migrations fall back to `DATABASE_URL`.
- `FRONTEND_URL`: Frontend origin(s) used for CORS/auth trusted origins. You can pass a comma-separated list.
- `PORT` (optional): Server port; defaults to `3001`.

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
