import { createAuthClient } from "better-auth/react";

function getBaseURL(): string {
  const rawUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!rawUrl) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "NEXT_PUBLIC_API_URL is not set in production. Auth requests will fall back to localhost."
      );
    }
    return "http://localhost:3001";
  }

  // Ensure the URL has a protocol prefix
  const withProtocol =
    !rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")
      ? `https://${rawUrl}`
      : rawUrl;

  return withProtocol.replace(/\/+$/, "");
}

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

export const { useSession, signIn, signUp, signOut } = authClient;
