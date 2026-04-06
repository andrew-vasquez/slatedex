import { createServerFn } from "@tanstack/react-start";
import { getRequest, getRequestHeader } from "@tanstack/react-start/server";
import { BACKEND_PROXY_PATH } from "@/lib/backend-url";

async function fetchFromBackend(path: string) {
  const request = getRequest();
  const origin = request ? new URL(request.url).origin : "";

  const response = await fetch(`${origin}${BACKEND_PROXY_PATH}${path}`, {
    headers: {
      cookie: getRequestHeader("cookie") ?? "",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export const getCurrentSession = createServerFn({ method: "GET" }).handler(async () => {
  return fetchFromBackend("/api/auth/get-session");
});

export const getMyProfile = createServerFn({ method: "GET" }).handler(async () => {
  return fetchFromBackend("/api/profiles/me");
});
