const LOCAL_API_FALLBACK = "http://localhost:3001";
export const BACKEND_PROXY_PATH = "/backend-proxy";
export const AUTH_BASE_PATH = "/api/auth";

function normalizeApiBaseUrl(rawUrl: string | undefined): string {
  const trimmed = rawUrl?.trim();

  if (!trimmed) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "NEXT_PUBLIC_API_URL is not set in production. Backend requests will fall back to localhost."
      );
    }
    return LOCAL_API_FALLBACK;
  }

  const unquoted = trimmed.replace(/^['"]+|['"]+$/g, "");
  const withProtocol =
    !unquoted.startsWith("http://") && !unquoted.startsWith("https://")
      ? `https://${unquoted}`
      : unquoted;

  let normalized = withProtocol.replace(/\/+$/, "");
  if (/(\/api)+$/i.test(normalized)) {
    normalized = normalized.replace(/(\/api)+$/i, "");
  }
  return normalized;
}

export function getExternalApiBaseUrl(): string {
  return normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
}

export function getClientSafeApiBaseUrl(): string {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    return `${window.location.origin}${BACKEND_PROXY_PATH}`;
  }

  return getExternalApiBaseUrl();
}

export function getClientSafeAuthBaseUrl(): string {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    return `${window.location.origin}${BACKEND_PROXY_PATH}${AUTH_BASE_PATH}`;
  }

  return `${getExternalApiBaseUrl()}${AUTH_BASE_PATH}`;
}
