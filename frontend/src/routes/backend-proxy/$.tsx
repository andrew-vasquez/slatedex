import { createFileRoute } from "@tanstack/react-router";
import { getExternalApiBaseUrl } from "@/lib/backend-url";

async function forwardRequest(request: Request, splat: string | undefined) {
  const upstreamPath = splat ? `/${splat}` : "";
  const upstreamUrl = new URL(`${getExternalApiBaseUrl()}${upstreamPath}`);
  const requestUrl = new URL(request.url);
  upstreamUrl.search = requestUrl.search;

  const headers = new Headers(request.headers);
  headers.delete("host");

  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
    init.duplex = "half";
  }

  const response = await fetch(upstreamUrl, init);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
}

export const Route = createFileRoute("/backend-proxy/$")({
  server: {
    handlers: {
      GET: ({ request, params }) => forwardRequest(request, params._splat),
      POST: ({ request, params }) => forwardRequest(request, params._splat),
      PUT: ({ request, params }) => forwardRequest(request, params._splat),
      PATCH: ({ request, params }) => forwardRequest(request, params._splat),
      DELETE: ({ request, params }) => forwardRequest(request, params._splat),
      OPTIONS: ({ request, params }) => forwardRequest(request, params._splat),
      HEAD: ({ request, params }) => forwardRequest(request, params._splat),
    },
  },
});
