import { createAuthClient } from "better-auth/react";
import { usernameClient } from "better-auth/client/plugins";
import { getClientSafeAuthBaseUrl } from "./backend-url";

export const authClient = createAuthClient({
  baseURL: getClientSafeAuthBaseUrl(),
  plugins: [usernameClient()],
});

export const { useSession, signIn, signUp, signOut } = authClient;
