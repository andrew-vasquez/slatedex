import { getExternalApiBaseUrl } from "@/lib/backend-url";

export async function getPublicProfileByUsername(username: string) {
  const response = await fetch(
    `${getExternalApiBaseUrl()}/api/profiles/${encodeURIComponent(username.toLowerCase())}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}
