const DEFAULT_PORT = 3001;
const DEFAULT_FRONTEND_ORIGIN = "http://localhost:3000";

function validateProductionAuthEnv(): void {
  if (process.env.NODE_ENV !== "production") return;

  const hasFrontendOrigins =
    (process.env.FRONTEND_URLS?.trim().length ?? 0) > 0 ||
    (process.env.FRONTEND_URL?.trim().length ?? 0) > 0;
  const hasBetterAuthUrl = (process.env.BETTER_AUTH_URL?.trim().length ?? 0) > 0;

  const missing: string[] = [];
  if (!hasFrontendOrigins) missing.push("FRONTEND_URL or FRONTEND_URLS");
  if (!hasBetterAuthUrl) missing.push("BETTER_AUTH_URL");

  if (missing.length > 0) {
    throw new Error(
      `Missing required production auth env var(s): ${missing.join(", ")}`
    );
  }
}

function parseOrigins(raw: string | undefined): string[] {
  if (!raw) return [DEFAULT_FRONTEND_ORIGIN];

  const origins = raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return origins.length > 0 ? origins : [DEFAULT_FRONTEND_ORIGIN];
}

function parsePort(raw: string | undefined): number {
  if (!raw) return DEFAULT_PORT;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

const frontendOrigins = parseOrigins(process.env.FRONTEND_URLS ?? process.env.FRONTEND_URL);
validateProductionAuthEnv();

export const config = {
  port: parsePort(process.env.PORT),
  frontendOrigins,
  primaryFrontendOrigin: frontendOrigins[0] ?? DEFAULT_FRONTEND_ORIGIN,
};

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  return config.frontendOrigins.includes(origin);
}
