const JSON_CONTENT_TYPE_PATTERN = /^application\/(?:json|[\w.+-]+\+json)(?:\s*;|$)/i;

type JsonReadResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413 | 415; error: string };

function hasExplicitNonJsonContentType(contentType: string | null): boolean {
  if (!contentType) return false;
  return !JSON_CONTENT_TYPE_PATTERN.test(contentType.trim());
}

function parseContentLength(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

async function readBodyTextWithinLimit(request: Request, maxBytes: number): Promise<string | null> {
  const reader = request.body?.getReader();

  if (!reader) {
    const text = await request.text();
    const size = new TextEncoder().encode(text).length;
    return size <= maxBytes ? text : null;
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel("Request body too large").catch(() => undefined);
      return null;
    }

    chunks.push(value);
  }

  const merged = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(merged);
}

export async function readJsonBody(request: Request, maxBytes: number): Promise<JsonReadResult> {
  const declaredLength = parseContentLength(request.headers.get("content-length"));
  if (declaredLength !== null && declaredLength > maxBytes) {
    return { ok: false, status: 413, error: "Request body is too large." };
  }

  if (hasExplicitNonJsonContentType(request.headers.get("content-type"))) {
    return { ok: false, status: 415, error: "Content-Type must be application/json." };
  }

  const bodyText = await readBodyTextWithinLimit(request, maxBytes);
  if (bodyText === null) {
    return { ok: false, status: 413, error: "Request body is too large." };
  }

  try {
    return { ok: true, value: JSON.parse(bodyText) };
  } catch {
    return { ok: false, status: 400, error: "Invalid request body" };
  }
}
