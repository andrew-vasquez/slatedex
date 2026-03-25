import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";
import { getClientSafeApiBaseUrl } from "./backend-url";

export const authClient = createAuthClient({
  baseURL: getClientSafeApiBaseUrl(),
  plugins: [usernameClient()],
});

export const { useSession, signIn, signUp, signOut } = authClient;
