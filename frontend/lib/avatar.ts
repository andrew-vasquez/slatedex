const TRUSTED_AVATAR_HOSTS = new Set([
  "lh3.googleusercontent.com",
  "avatars.githubusercontent.com",
  "cdn.discordapp.com",
]);
// TODO(security): replace direct third-party URLs with first-party proxy/uploaded avatars.

export function isSupportedAvatarUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith("/")) return true;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

    const host = parsed.hostname.toLowerCase();
    if (TRUSTED_AVATAR_HOSTS.has(host)) return true;

    return process.env.NODE_ENV !== "production" && (host === "localhost" || host === "127.0.0.1");
  } catch {
    return false;
  }
}

export function normalizeAvatarUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return isSupportedAvatarUrl(trimmed) ? trimmed : null;
}
