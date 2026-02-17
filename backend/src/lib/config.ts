const DEFAULT_PORT = 3001;
const DEFAULT_FRONTEND_ORIGIN = "http://localhost:3000";

function ensureProtocol(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

function normalizeAllowedOrigin(value: string): string {
  const withProtocol = ensureProtocol(value).replace(/\/+$/, "");
  if (withProtocol.includes("*")) return withProtocol;

  try {
    return new URL(withProtocol).origin;
  } catch {
    return withProtocol;
  }
}

function normalizeRequestOrigin(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed;
  }
}

function matchesAllowedOrigin(origin: string, allowedOrigin: string): boolean {
  if (!allowedOrigin.includes("*")) return origin === allowedOrigin;

  const escaped = allowedOrigin
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\\*/g, ".*");
  const matcher = new RegExp(`^${escaped}$`);
  return matcher.test(origin);
}

function validateProductionAuthEnv(): void {
  if (process.env.NODE_ENV !== "production") return;

  const hasFrontendOrigin = (process.env.FRONTEND_URL?.trim().length ?? 0) > 0;
  const hasBetterAuthUrl = (process.env.BETTER_AUTH_URL?.trim().length ?? 0) > 0;

  const missing: string[] = [];
  if (!hasFrontendOrigin) missing.push("FRONTEND_URL");
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
    .map((value) => normalizeAllowedOrigin(value))
    .filter((value) => value.length > 0);

  const uniqueOrigins = Array.from(new Set(origins));
  return uniqueOrigins.length > 0 ? uniqueOrigins : [DEFAULT_FRONTEND_ORIGIN];
}

function parsePort(raw: string | undefined): number {
  if (!raw) return DEFAULT_PORT;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

const frontendOrigins = parseOrigins(process.env.FRONTEND_URL?.trim());
validateProductionAuthEnv();

export const config = {
  port: parsePort(process.env.PORT),
  frontendOrigins,
  primaryFrontendOrigin: frontendOrigins[0] ?? DEFAULT_FRONTEND_ORIGIN,
};

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  const normalizedOrigin = normalizeRequestOrigin(origin);
  return config.frontendOrigins.some((allowedOrigin) =>
    matchesAllowedOrigin(normalizedOrigin, allowedOrigin)
  );
}
