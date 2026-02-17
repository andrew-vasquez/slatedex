const DEFAULT_SITE_URL = "https://pokemon-team-builder.com";

function normalizeUrl(value: string | undefined): string {
  if (!value) return DEFAULT_SITE_URL;
  return value.replace(/\/+$/, "");
}

export const SITE_URL = normalizeUrl(process.env.NEXT_PUBLIC_SITE_URL);

export const METADATA_BASE = (() => {
  try {
    return new URL(SITE_URL);
  } catch {
    return new URL(DEFAULT_SITE_URL);
  }
})();
