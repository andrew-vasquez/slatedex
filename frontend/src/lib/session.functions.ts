import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { getExternalApiBaseUrl } from "@/lib/backend-url";

async function fetchFromBackend(path: string) {
  try {
    const response = await fetch(`${getExternalApiBaseUrl()}${path}`, {
      headers: {
        cookie: getRequestHeader("cookie") ?? "",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.warn(`[session.functions] Failed backend request for ${path}`, error);
    return null;
  }
}

export const getCurrentSession = createServerFn({ method: "GET" }).handler(async () => {
  return fetchFromBackend("/api/auth/get-session");
});

export const getMyProfile = createServerFn({ method: "GET" }).handler(async () => {
  return fetchFromBackend("/api/profiles/me");
});
