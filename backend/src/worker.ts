/// <reference types="@cloudflare/workers-types" />

import "./register-worker";
import { app } from "./app";
import { primeWorkerRuntime, type WorkerBindings } from "./lib/runtime";

const worker: ExportedHandler<WorkerBindings> = {
  fetch(request, env, ctx) {
    primeWorkerRuntime(env);
    return app.fetch(request, env, ctx);
  },
};

export default worker;
