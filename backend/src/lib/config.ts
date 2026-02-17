const DEFAULT_PORT = 3001;
const DEFAULT_FRONTEND_ORIGIN = "http://localhost:3000";

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

export const config = {
  port: parsePort(process.env.PORT),
  frontendOrigins,
  primaryFrontendOrigin: frontendOrigins[0] ?? DEFAULT_FRONTEND_ORIGIN,
};

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  return config.frontendOrigins.includes(origin);
}
