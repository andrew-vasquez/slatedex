export function env(key: string): string | undefined {
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
