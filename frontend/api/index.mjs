import { Buffer } from "node:buffer";

let cachedServerEntry;

async function getServerEntry() {
  if (!cachedServerEntry) {
    cachedServerEntry = import("../dist/server/server.js").then((mod) => mod.default);
  }

  return cachedServerEntry;
}

function toAbsoluteUrl(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const proto = req.headers["x-forwarded-proto"] || "https";
  const url = new URL(req.url || "/", `${proto}://${host}`);

  // Preserve the TanStack route names while exposing standard SEO endpoints.
  if (url.pathname === "/robots.txt") {
    url.pathname = "/robots/txt";
  } else if (url.pathname === "/sitemap.xml") {
    url.pathname = "/sitemap/xml";
  }

  return url;
}

function toHeaders(req) {
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const entry of value) {
        headers.append(key, entry);
      }
      continue;
    }

    if (typeof value === "string") {
      headers.set(key, value);
    }
  }

  return headers;
}

async function readBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return chunks.length > 0 ? Buffer.concat(chunks) : undefined;
}

async function sendResponse(res, response) {
  res.statusCode = response.status;
  res.statusMessage = response.statusText;

  const setCookie = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : response.headers.get("set-cookie");

  if (Array.isArray(setCookie) && setCookie.length > 0) {
    res.setHeader("set-cookie", setCookie);
  } else if (typeof setCookie === "string" && setCookie) {
    res.setHeader("set-cookie", setCookie);
  }

  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === "set-cookie") return;
    res.setHeader(key, value);
  });

  const body = await response.arrayBuffer();
  res.end(Buffer.from(body));
}

export default async function handler(req, res) {
  try {
    const serverEntry = await getServerEntry();
    const url = toAbsoluteUrl(req);
    const headers = toHeaders(req);
    const method = req.method || "GET";
    const body = method === "GET" || method === "HEAD" ? undefined : await readBody(req);

    const request = new Request(url, {
      method,
      headers,
      body,
      duplex: body ? "half" : undefined,
    });

    const response = await serverEntry.fetch(request);
    await sendResponse(res, response);
  } catch (error) {
    console.error("[vercel-ssr] request failed", error);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
}
