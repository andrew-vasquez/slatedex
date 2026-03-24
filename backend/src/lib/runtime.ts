/**
 * Cloudflare Worker bindings + Bun `process.env` bridge.
 *
 * - Call `primeWorkerRuntime(env)` at the start of each Worker fetch (see `worker.ts`).
 * - Call `primeBunRuntime()` once before serving or running CLI scripts (see `index.ts`, scripts).
 */
export type WorkerBindings = Record<string, unknown>;

let bindings: WorkerBindings | undefined;

declare global {
  // eslint-disable-next-line no-var
  var __POKE_WORKER__: boolean | undefined;
}

export function markWorkerBuild(): void {
  globalThis.__POKE_WORKER__ = true;
}

export function isWorkerDeployment(): boolean {
  return globalThis.__POKE_WORKER__ === true;
}

export function primeWorkerRuntime(env: WorkerBindings): void {
  bindings = env;
}

export function primeBunRuntime(): void {
  bindings = undefined;
}

function isBindingString(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Read env: Worker secrets from primed bindings first, else `process.env`.
 */
export function env(key: string): string | undefined {
  if (bindings) {
    const raw = bindings[key];
    if (isBindingString(raw)) {
      const t = raw.trim();
      return t.length > 0 ? t : undefined;
    }
  }
  const v = typeof process !== "undefined" ? process.env[key] : undefined;
  const t = v?.trim();
  return t && t.length > 0 ? t : undefined;
}

export function nodeEnv(): string {
  return env("NODE_ENV") ?? "development";
}

export function isProduction(): boolean {
  return nodeEnv() === "production";
}

/** Subset of KV used for rate limiting (Cloudflare KVNamespace-compatible). */
export type RateLimitKv = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
};

export function getRateLimitKvFromBindings(): RateLimitKv | undefined {
  if (!bindings) return undefined;
  const kv = bindings.RATE_LIMIT_KV;
  if (kv && typeof (kv as RateLimitKv).get === "function" && typeof (kv as RateLimitKv).put === "function") {
    return kv as RateLimitKv;
  }
  return undefined;
}
