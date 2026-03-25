import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { username } from "better-auth/plugins/username";
import { getPrisma } from "../db";
import { getConfig } from "./config";
import { env, isProduction } from "./runtime";

const USERNAME_REGEX = /^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])?$/;
const AUTH_BASE_PATH = "/api/auth";

function getBaseURL(): string {
  const url = env("BETTER_AUTH_URL");
  if (!url) return `http://localhost:${getConfig().port}`;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}

function buildAuth() {
  const cfg = getConfig();
  return betterAuth({
    baseURL: getBaseURL(),
    basePath: AUTH_BASE_PATH,
    database: prismaAdapter(getPrisma(), {
      provider: "postgresql",
    }),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    plugins: [
      username({
        minUsernameLength: 3,
        maxUsernameLength: 30,
        usernameNormalization: (value) => value.trim().toLowerCase(),
        usernameValidator: (value) => USERNAME_REGEX.test(value),
        schema: {
          user: {
            fields: {
              username: "username",
              displayUsername: "username",
            },
          },
        },
      }),
    ],
    trustedOrigins: cfg.frontendOrigins,
    advanced: {
      useSecureCookies: isProduction(),
      defaultCookieAttributes: {
        // Keep auth cookies first-party friendly for Safari/iOS by relying on the frontend proxy.
        sameSite: "lax",
        secure: isProduction(),
      },
    },
  });
}

type AuthInstance = ReturnType<typeof betterAuth>;

let authSingleton: AuthInstance | undefined;

export function getAuth(): AuthInstance {
  if (!authSingleton) {
    authSingleton = buildAuth();
  }
  return authSingleton;
}

export const auth = new Proxy({} as AuthInstance, {
  get(_target, prop, receiver) {
    const real = getAuth();
    return Reflect.get(real, prop, receiver === auth ? real : receiver);
  },
});
