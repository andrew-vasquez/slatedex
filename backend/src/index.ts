import { app } from "./app";
import { getConfig } from "./lib/config";
import { primeBunRuntime } from "./lib/runtime";
import { shutdownPostHog } from "./lib/posthog";

primeBunRuntime();
const cfg = getConfig();

const SERVER_SYMBOL = Symbol.for("poke-builder.server");
const SHUTDOWN_HANDLER_SYMBOL = Symbol.for("poke-builder.shutdown-handler");
const SHUTTING_DOWN_SYMBOL = Symbol.for("poke-builder.shutting-down");
type BunServer = ReturnType<typeof Bun.serve>;
type ShutdownHandler = (signal: "SIGINT" | "SIGTERM") => void;
type GlobalWithServer = typeof globalThis & {
  [SERVER_SYMBOL]?: BunServer;
  [SHUTDOWN_HANDLER_SYMBOL]?: ShutdownHandler;
  [SHUTTING_DOWN_SYMBOL]?: boolean;
};
const globalWithServer = globalThis as GlobalWithServer;

if (globalWithServer[SERVER_SYMBOL]) {
  globalWithServer[SERVER_SYMBOL]?.stop(true);
}
if (globalWithServer[SHUTDOWN_HANDLER_SYMBOL]) {
  process.off("SIGINT", globalWithServer[SHUTDOWN_HANDLER_SYMBOL]);
  process.off("SIGTERM", globalWithServer[SHUTDOWN_HANDLER_SYMBOL]);
}

const server = Bun.serve({
  port: cfg.port,
  fetch: app.fetch,
});
globalWithServer[SERVER_SYMBOL] = server;
globalWithServer[SHUTTING_DOWN_SYMBOL] = false;

const handleShutdown: ShutdownHandler = (signal) => {
  if (globalWithServer[SHUTTING_DOWN_SYMBOL]) return;
  globalWithServer[SHUTTING_DOWN_SYMBOL] = true;
  console.debug(`[server] shutting down (${signal})`);

  void (async () => {
    try {
      await shutdownPostHog();
    } catch (error) {
      console.error("[posthog] shutdown error", error);
    }

    try {
      server.stop(true);
    } catch (error) {
      console.error("[server] stop error", error);
    }

    if (globalWithServer[SERVER_SYMBOL] === server) {
      delete globalWithServer[SERVER_SYMBOL];
    }
    delete globalWithServer[SHUTTING_DOWN_SYMBOL];
    process.exit(0);
  })();
};

globalWithServer[SHUTDOWN_HANDLER_SYMBOL] = handleShutdown;
process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);
console.debug(`Started server: ${server.url}`);

export { app };
