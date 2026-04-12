import { createFileRoute } from "@tanstack/react-router";

const SENTRY_TUNNEL_URL = "https://o4510846095589376.ingest.us.sentry.io/api/4510903101554688/envelope/";

async function forwardTunnelRequest(request: Request) {
  const headers = new Headers();
  const contentType = request.headers.get("content-type");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  const sentryResponse = await fetch(SENTRY_TUNNEL_URL, {
    method: "POST",
    headers,
    body: await request.arrayBuffer(),
  });

  return new Response(null, {
    status: sentryResponse.status,
    statusText: sentryResponse.statusText,
  });
}

export const Route = createFileRoute("/tunnel")({
  server: {
    handlers: {
      POST: ({ request }) => forwardTunnelRequest(request),
      OPTIONS: () =>
        new Response(null, {
          status: 204,
          headers: {
            Allow: "POST, OPTIONS",
          },
        }),
    },
  },
});
