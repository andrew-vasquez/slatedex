import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;
let hasLoggedInitError = false;

/**
 * Get the PostHog Node client for LLM analytics.
 * Returns null if POSTHOG_API_KEY is not set (analytics disabled).
 */
export function getPostHog(): PostHog | null {
  const apiKey = process.env.POSTHOG_API_KEY?.trim();
  const host = process.env.POSTHOG_HOST?.trim() || "https://us.i.posthog.com";
  if (!apiKey) return null;

  if (!posthogClient) {
    try {
      posthogClient = new PostHog(apiKey, { host });
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
 * Shutdown PostHog and flush pending events.
 * Call this on server shutdown (e.g. process exit).
 */
export async function shutdownPostHog(): Promise<void> {
  if (posthogClient) {
    await posthogClient.shutdown();
    posthogClient = null;
  }
}
