import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;
let hasLoggedInitError = false;
let hasLoggedDisabledNotice = false;
let hasLoggedEnabledNotice = false;

type PostHogCaptureParams = {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
};

/**
 * Get the PostHog Node client for LLM analytics.
 * Returns null if POSTHOG_API_KEY is not set (analytics disabled).
 */
export function getPostHog(): PostHog | null {
  const apiKey = process.env.POSTHOG_API_KEY?.trim();
  const host = process.env.POSTHOG_HOST?.trim() || "https://us.i.posthog.com";
  if (!apiKey) {
    if (!hasLoggedDisabledNotice && process.env.NODE_ENV !== "production") {
      hasLoggedDisabledNotice = true;
      console.info("[posthog] POSTHOG_API_KEY is not set; analytics are disabled.");
    }
    return null;
  }

  if (!posthogClient) {
    try {
      posthogClient = new PostHog(apiKey, { host });
      if (!hasLoggedEnabledNotice) {
        hasLoggedEnabledNotice = true;
        console.info(`[posthog] analytics enabled (${host}).`);
      }
    } catch (error) {
      if (!hasLoggedInitError) {
        hasLoggedInitError = true;
        console.error("[posthog] failed to initialize analytics client; continuing without analytics", error);
      }
      return null;
    }
  }

  return posthogClient;
}

/**
 * Capture a PostHog event immediately (no batching delay).
 * Never throws; analytics failures are logged and ignored.
 */
export async function capturePostHogEventImmediate({
  distinctId,
  event,
  properties,
}: PostHogCaptureParams): Promise<void> {
  const client = getPostHog();
  if (!client) return;

  try {
    await client.captureImmediate({
      distinctId,
      event,
      properties,
    });
  } catch (error) {
    console.error("[posthog] failed to capture event", { event, distinctId, error });
  }
}

/**
 * Shutdown PostHog and flush pending events.
 * Call this on server shutdown (e.g. process exit).
 */
export async function shutdownPostHog(): Promise<void> {
  if (posthogClient) {
    await posthogClient.shutdown();
    posthogClient = null;
  }
}
