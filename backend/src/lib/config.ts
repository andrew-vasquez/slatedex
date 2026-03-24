import { env, isProduction } from "./runtime";

const DEFAULT_PORT = 3001;
const DEFAULT_FRONTEND_ORIGIN = "http://localhost:3000";
const DEFAULT_AI_MODEL = "gpt-4o-mini";
const DEFAULT_AI_CHAT_MODEL = "gpt-4o-mini";
const DEFAULT_AI_ANALYZE_MODEL = "gpt-4.1-mini";
const DEFAULT_AI_TIMEOUT_MS = 30_000;
const DEFAULT_AI_MAX_OUTPUT_TOKENS = 700;
const DEFAULT_AI_CHAT_MAX_OUTPUT_TOKENS = 420;
const DEFAULT_AI_ANALYZE_MAX_OUTPUT_TOKENS = 560;
const DEV_FALLBACK_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

export type AppConfig = {
  port: number;
  frontendOrigins: string[];
  primaryFrontendOrigin: string;
  ai: {
    enabled: boolean;
    apiKey: string;
    model: string;
    models: { chat: string; analyze: string };
    requestTimeoutMs: number;
    maxOutputTokens: number;
    maxOutputTokensByTask: { chat: number; analyze: number };
  };
};

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

function isPrivateIpv4Host(hostname: string): boolean {
  if (/^10\./.test(hostname)) return true;
  if (/^192\.168\./.test(hostname)) return true;

  const match = hostname.match(/^172\.(\d{1,3})\./);
  if (!match) return false;

  const octet = Number(match[1]);
  return Number.isInteger(octet) && octet >= 16 && octet <= 31;
}

function isDevelopmentOrigin(origin: string): boolean {
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") return true;
    return isPrivateIpv4Host(parsed.hostname);
  } catch {
    return false;
  }
}

function parseOrigins(raw: string | undefined): string[] {
  if (!raw) return [DEFAULT_FRONTEND_ORIGIN];

  const origins = raw
    .split(",")
    .map((value) => normalizeAllowedOrigin(value))
    .filter((value) => value.length > 0);

  if (!isProduction()) {
    origins.push(...DEV_FALLBACK_ORIGINS);
  }

  const uniqueOrigins = Array.from(new Set(origins));
  return uniqueOrigins.length > 0 ? uniqueOrigins : [DEFAULT_FRONTEND_ORIGIN];
}

function parsePort(raw: string | undefined): number {
  if (!raw) return DEFAULT_PORT;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

function parseBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (!raw) return fallback;
  const value = raw.trim().toLowerCase();
  if (value === "1" || value === "true" || value === "yes" || value === "on") return true;
  if (value === "0" || value === "false" || value === "no" || value === "off") return false;
  return fallback;
}

function parsePositiveInteger(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function validateProductionAuthEnv(): void {
  if (!isProduction()) return;

  const hasFrontendOrigin = (env("FRONTEND_URL")?.length ?? 0) > 0;
  const hasBetterAuthUrl = (env("BETTER_AUTH_URL")?.length ?? 0) > 0;

  const missing: string[] = [];
  if (!hasFrontendOrigin) missing.push("FRONTEND_URL");
  if (!hasBetterAuthUrl) missing.push("BETTER_AUTH_URL");

  if (missing.length > 0) {
    throw new Error(`Missing required production auth env var(s): ${missing.join(", ")}`);
  }
}

function validateBetterAuthSecret(): void {
  const secret = env("BETTER_AUTH_SECRET");

  if (!isProduction()) return;

  if (!secret) {
    throw new Error("Missing required production auth env var: BETTER_AUTH_SECRET");
  }

  if (secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be at least 32 characters in production.");
  }
}

function buildAppConfig(): AppConfig {
  const frontendOrigins = parseOrigins(env("FRONTEND_URL"));
  const aiEnabled = parseBoolean(env("ENABLE_AI_COACH"), true);
  const aiApiKey = env("OPENAI_API_KEY") ?? "";
  const aiGlobalModel = env("OPENAI_MODEL") ?? "";
  const aiModelFallback = aiGlobalModel || DEFAULT_AI_MODEL;
  const aiChatModel = env("OPENAI_MODEL_CHAT")?.trim() || aiGlobalModel || DEFAULT_AI_CHAT_MODEL;
  const aiAnalyzeModel =
    env("OPENAI_MODEL_ANALYZE")?.trim() || aiGlobalModel || DEFAULT_AI_ANALYZE_MODEL;
  const aiTimeoutMs = parsePositiveInteger(env("AI_REQUEST_TIMEOUT_MS"), DEFAULT_AI_TIMEOUT_MS);
  const aiGlobalMaxOutputTokensRaw = env("AI_MAX_OUTPUT_TOKENS");
  const aiMaxOutputTokensFallback = parsePositiveInteger(
    aiGlobalMaxOutputTokensRaw,
    DEFAULT_AI_MAX_OUTPUT_TOKENS
  );
  const aiChatMaxOutputTokens = parsePositiveInteger(
    env("AI_MAX_OUTPUT_TOKENS_CHAT"),
    aiGlobalMaxOutputTokensRaw ? aiMaxOutputTokensFallback : DEFAULT_AI_CHAT_MAX_OUTPUT_TOKENS
  );
  const aiAnalyzeMaxOutputTokens = parsePositiveInteger(
    env("AI_MAX_OUTPUT_TOKENS_ANALYZE"),
    aiGlobalMaxOutputTokensRaw ? aiMaxOutputTokensFallback : DEFAULT_AI_ANALYZE_MAX_OUTPUT_TOKENS
  );

  validateProductionAuthEnv();
  validateBetterAuthSecret();

  if (isProduction() && aiEnabled && !aiApiKey) {
    throw new Error("OPENAI_API_KEY is required in production when ENABLE_AI_COACH is enabled.");
  }

  return {
    port: parsePort(env("PORT")),
    frontendOrigins,
    primaryFrontendOrigin: frontendOrigins[0] ?? DEFAULT_FRONTEND_ORIGIN,
    ai: {
      enabled: aiEnabled,
      apiKey: aiApiKey,
      model: aiModelFallback,
      models: {
        chat: aiChatModel,
        analyze: aiAnalyzeModel,
      },
      requestTimeoutMs: aiTimeoutMs,
      maxOutputTokens: aiMaxOutputTokensFallback,
      maxOutputTokensByTask: {
        chat: aiChatMaxOutputTokens,
        analyze: aiAnalyzeMaxOutputTokens,
      },
    },
  };
}

let cachedConfig: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!cachedConfig) {
    cachedConfig = buildAppConfig();
  }
  return cachedConfig;
}

/** @deprecated Prefer `getConfig()` — proxy for gradual migration */
export const config = new Proxy({} as AppConfig, {
  get(_, prop) {
    return (getConfig() as Record<string, unknown>)[prop as string];
  },
});

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  const normalizedOrigin = normalizeRequestOrigin(origin);
  const cfg = getConfig();

  const matched = cfg.frontendOrigins.some((allowedOrigin) =>
    matchesAllowedOrigin(normalizedOrigin, allowedOrigin)
  );
  if (matched) return true;

  if (!isProduction() && isDevelopmentOrigin(normalizedOrigin)) {
    return true;
  }

  return false;
}

export function resetConfigCacheForTests(): void {
  cachedConfig = null;
}
