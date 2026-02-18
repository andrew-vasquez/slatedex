import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins/username";
import { prisma } from "../db";
import { config } from "./config";

const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])?$/;

function getBaseURL(): string {
  const url = process.env.BETTER_AUTH_URL;
  if (!url) return `http://localhost:${config.port}`;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}

export const auth = betterAuth({
  baseURL: getBaseURL(),
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
      usernameNormalization: (value) => value.trim().toLowerCase(),
      usernameValidator: (value) => USERNAME_REGEX.test(value),
      schema: {
        // Reuse existing `user.username` until/if we add a dedicated `displayUsername` column.
        user: {
          fields: {
            username: "username",
            displayUsername: "username",
          },
        },
      },
    }),
  ],
  trustedOrigins: config.frontendOrigins,
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      // Required for cross-site auth cookies in modern Chrome (CHIPS).
      partitioned: process.env.NODE_ENV === "production",
    },
  },
});
