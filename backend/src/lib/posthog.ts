import { env } from "./runtime";

type PostHogCaptureParams = {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
};

function captureHost(): string {
  const raw = env("POSTHOG_HOST")?.trim() || "https://us.i.posthog.com";
  return raw.replace(/\/+$/, "");
}

/**
 * Capture a PostHog event via HTTP. Never throws.
 */
export async function capturePostHogEventImmediate({
  distinctId,
  event,
  properties,
}: PostHogCaptureParams): Promise<void> {
  const apiKey = env("POSTHOG_API_KEY")?.trim();
  if (!apiKey) return;

  try {
    const res = await fetch(`${captureHost()}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        event,
        distinct_id: distinctId,
        properties: properties ?? {},
      }),
    });
    if (!res.ok) {
      console.error("[posthog] capture failed", res.status, await res.text().catch(() => ""));
    }
  } catch (error) {
    console.error("[posthog] failed to capture event", { event, distinctId, error });
  }
}

/**
 * Legacy hook for OpenAI instrumentation; HTTP capture is used at call sites instead.
 */
export function getPostHog(): null {
  return null;
}

export async function shutdownPostHog(): Promise<void> {
  // No persistent client (HTTP-only).
}
