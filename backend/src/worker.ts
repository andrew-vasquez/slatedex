/// <reference types="@cloudflare/workers-types" />

import "./register-worker";
import { app } from "./app";
import { primeWorkerRuntime, type WorkerBindings } from "./lib/runtime";

type CfExecutionContext = {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
};

export default {
  fetch(request: Request, env: WorkerBindings, ctx: CfExecutionContext) {
    primeWorkerRuntime(env);
    return app.fetch(request, env, ctx);
  },
};
