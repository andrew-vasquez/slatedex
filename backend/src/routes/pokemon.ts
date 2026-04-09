import { Hono } from "hono";
import { env } from "../lib/runtime";
import { readJsonBody } from "../lib/request";

const pokemon = new Hono();
const DEFAULT_POKEPROXY_URL = "http://localhost:8080";
const MAX_BATCH_NAMES = 6;
const MAX_BATCH_REQUEST_BODY_BYTES = 8_192;

function getPokeProxyBaseUrl(): string {
  const raw = env("POKEPROXY_URL") ?? DEFAULT_POKEPROXY_URL;
  return raw.replace(/\/+$/, "");
}

async function proxyJsonRequest(routeLabel: string, upstreamUrl: URL, init?: RequestInit) {
  const startedAt = Date.now();

  let response: Response;
  try {
    response = await fetch(upstreamUrl, init);
  } catch (error) {
    console.error(`[pokemon-proxy] ${routeLabel} upstream fetch failed`, {
      upstreamUrl: upstreamUrl.toString(),
      method: init?.method ?? "GET",
      error,
    });
    throw error;
  }

  const contentType = response.headers.get("content-type") ?? "application/json";
  const body = await response.text();

  if (!response.ok) {
    console.error(`[pokemon-proxy] ${routeLabel} upstream returned ${response.status}`, {
      upstreamUrl: upstreamUrl.toString(),
      method: init?.method ?? "GET",
      durationMs: Date.now() - startedAt,
      responseBody: body.slice(0, 400),
    });
  }

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      "Content-Type": contentType,
    },
  });
}

function normalizeBatchNames(searchParams: URLSearchParams): string[] {
  const explicitNames = searchParams
    .getAll("name")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (explicitNames.length > 0) return explicitNames;

  return (searchParams.get("names") ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

pokemon.get("/pokemon", async (c) => {
  const upstreamUrl = new URL(`${getPokeProxyBaseUrl()}/pokemon`);
  upstreamUrl.search = new URL(c.req.url).search;
  return proxyJsonRequest("GET /api/pokemon", upstreamUrl);
});

pokemon.get("/pokemon/batch", async (c) => {
  const names = normalizeBatchNames(new URL(c.req.url).searchParams);
  if (names.length === 0) {
    return c.json({ error: "Provide at least one Pokemon name." }, 400);
  }
  if (names.length > MAX_BATCH_NAMES) {
    return c.json({ error: `Max ${MAX_BATCH_NAMES} pokemon per request.` }, 400);
  }

  const upstreamUrl = new URL(`${getPokeProxyBaseUrl()}/pokemon/batch`);
  return proxyJsonRequest("GET /api/pokemon/batch", upstreamUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ names }),
  });
});

pokemon.post("/pokemon/batch", async (c) => {
  const parsedBody = await readJsonBody(c.req.raw, MAX_BATCH_REQUEST_BODY_BYTES);
  if (!parsedBody.ok) {
    return c.json({ error: parsedBody.error }, parsedBody.status);
  }

  const names = Array.isArray((parsedBody.value as { names?: unknown }).names)
    ? ((parsedBody.value as { names: unknown[] }).names
        .map((value) => (typeof value === "string" ? value.trim().toLowerCase() : ""))
        .filter(Boolean) as string[])
    : [];

  if (names.length === 0) {
    return c.json({ error: "Provide at least one Pokemon name." }, 400);
  }
  if (names.length > MAX_BATCH_NAMES) {
    return c.json({ error: `Max ${MAX_BATCH_NAMES} pokemon per request.` }, 400);
  }

  const upstreamUrl = new URL(`${getPokeProxyBaseUrl()}/pokemon/batch`);
  return proxyJsonRequest("POST /api/pokemon/batch", upstreamUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ names }),
  });
});

pokemon.get("/pokemon/:name", async (c) => {
  const upstreamUrl = new URL(
    `${getPokeProxyBaseUrl()}/pokemon/${encodeURIComponent(c.req.param("name"))}`
  );
  return proxyJsonRequest("GET /api/pokemon/:name", upstreamUrl);
});

pokemon.get("/type/:name", async (c) => {
  const upstreamUrl = new URL(
    `${getPokeProxyBaseUrl()}/type/${encodeURIComponent(c.req.param("name"))}`
  );
  return proxyJsonRequest("GET /api/type/:name", upstreamUrl);
});

export default pokemon;
