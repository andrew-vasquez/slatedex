import { createAuthClient } from "better-auth/react";

function getBaseURL(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) return "http://localhost:3001";
  // Ensure the URL has a protocol prefix
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

export const { useSession, signIn, signUp, signOut } = authClient;
