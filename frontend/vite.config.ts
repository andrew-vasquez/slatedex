import { sentryTanstackStart } from "@sentry/tanstackstart-react/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { createLogger, defineConfig, loadEnv } from "vite";

const viteLogger = createLogger();
const warn = viteLogger.warn;

viteLogger.warn = (msg, options) => {
  if (
    msg.includes("Failed to load source map for") &&
    msg.includes("node_modules") &&
    msg.includes("ENOENT: no such file or directory")
  ) {
    return;
  }

  warn(msg, options);
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    customLogger: viteLogger,
    server: {
      port: 3000,
    },
    resolve: {
      tsconfigPaths: true,
    },
    define: {
      "process.env.NODE_ENV": JSON.stringify(mode),
      "process.env.NEXT_PUBLIC_API_URL": JSON.stringify(env.NEXT_PUBLIC_API_URL ?? ""),
      "process.env.NEXT_PUBLIC_SITE_URL": JSON.stringify(env.NEXT_PUBLIC_SITE_URL ?? ""),
    },
    plugins: [
      tailwindcss(),
      tanstackStart(),
      react(),
      sentryTanstackStart({
        org: "andrew-vasquez",
        project: "slatedex-frontend",
        authToken: env.SENTRY_AUTH_TOKEN,
      }),
    ],
  };
});
