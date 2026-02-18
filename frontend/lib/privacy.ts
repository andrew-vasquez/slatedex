export const COOKIE_CONSENT_STORAGE_KEY = "cookie-consent-v1";
export const OPEN_COOKIE_PREFERENCES_EVENT = "cookie-preferences:open";
export const COOKIE_CONSENT_UPDATED_EVENT = "cookie-consent:updated";

export interface CookieConsent {
  version: 1;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
}

function isCookieConsent(value: unknown): value is CookieConsent {
  if (!value || typeof value !== "object") return false;
  const parsed = value as Partial<CookieConsent>;
  return (
    parsed.version === 1 &&
    parsed.necessary === true &&
    typeof parsed.analytics === "boolean" &&
    typeof parsed.marketing === "boolean" &&
    typeof parsed.decidedAt === "string"
  );
}

export function createConsent(options: { analytics: boolean; marketing: boolean }): CookieConsent {
  return {
    version: 1,
    necessary: true,
    analytics: options.analytics,
    marketing: options.marketing,
    decidedAt: new Date().toISOString(),
  };
}

export function readCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isCookieConsent(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCookieConsent(consent: CookieConsent): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));
    window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_UPDATED_EVENT, { detail: consent }));
  } catch {
    // ignore storage write failures
  }
}

export function openCookiePreferences(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_COOKIE_PREFERENCES_EVENT));
}
