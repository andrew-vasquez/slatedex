import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
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
    plugins: [tailwindcss(), tanstackStart(), react()],
  };
});
