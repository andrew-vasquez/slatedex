import OpenAI from "openai";
import { OpenAI as PostHogOpenAI } from "@posthog/ai";
import {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIError,
  APIUserAbortError,
} from "openai";
import type {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions/completions";
import { config } from "../config";
import { getPostHog } from "../posthog";

type OpenAIClientType = OpenAI;
let openAiClient: OpenAIClientType | null = null;
let openAiClientHasPostHog = false;

export class AiRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiRequestError";
  }
}

export type AiAnalyticsContext = {
  distinctId?: string;
  traceId?: string;
  properties?: Record<string, unknown>;
};

function getClient(): OpenAIClientType {
  if (!config.ai.apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  if (!openAiClient) {
    const ph = getPostHog();
    if (ph) {
      try {
        openAiClient = new PostHogOpenAI({
          apiKey: config.ai.apiKey,
          posthog: ph,
        }) as unknown as OpenAIClientType;
        openAiClientHasPostHog = true;
      } catch (error) {
        console.error("[ai] failed to initialize PostHog OpenAI wrapper; falling back to OpenAI client", error);
        openAiClient = new OpenAI({ apiKey: config.ai.apiKey });
        openAiClientHasPostHog = false;
      }
    } else {
      openAiClient = new OpenAI({ apiKey: config.ai.apiKey });
      openAiClientHasPostHog = false;
    }
  }

  return openAiClient;
}

function extractTextFromContent(content: ChatCompletionMessage["content"]): string {
  if (!content) return "";
  if (typeof content === "string") return content.trim();

  if (Array.isArray(content)) {
    const parts = content as Array<{
      type?: string;
      text?: string | { value?: string };
      value?: string;
    }>;
    const text = parts
      .map((item) => {
        if (item.type === "text" || item.type === "output_text") {
          if (typeof item.text === "string") return item.text;
          if (item.text && typeof item.text === "object" && typeof item.text.value === "string") {
            return item.text.value;
          }
          if (typeof item.value === "string") return item.value;
        }
        return "";
      })
      .join("\n")
      .trim();

    return text;
  }

  return "";
}

function extractTextFromResponse(response: unknown): string {
  const fromChoices = extractTextFromContent(
    (response as { choices?: Array<{ message?: { content?: ChatCompletionMessage["content"] } }> })
      ?.choices?.[0]?.message?.content
  );
  if (fromChoices) return fromChoices;

  const responseRecord = response as { output_text?: unknown; output?: unknown };
  if (typeof responseRecord.output_text === "string" && responseRecord.output_text.trim().length > 0) {
    return responseRecord.output_text.trim();
  }

  if (Array.isArray(responseRecord.output)) {
    const outputText = responseRecord.output
      .map((item) => {
        const content = (item as { content?: unknown })?.content;
        if (!Array.isArray(content)) return "";
        return content
          .map((part) => {
            const typedPart = part as { type?: unknown; text?: unknown };
            if (
              (typedPart.type === "output_text" || typedPart.type === "text") &&
              typeof typedPart.text === "string"
            ) {
              return typedPart.text;
            }
            return "";
          })
          .filter(Boolean)
          .join("\n");
      })
      .filter(Boolean)
      .join("\n")
      .trim();

    if (outputText) return outputText;
  }

  return "";
}

function isAbortedProviderMessage(message: unknown): boolean {
  return typeof message === "string" && message.trim().toLowerCase() === "request was aborted.";
}

function supportsCustomTemperature(model: string): boolean {
  const normalized = model.trim().toLowerCase();
  return !normalized.startsWith("gpt-5");
}

export async function generateAiText(
  messages: ChatCompletionMessageParam[],
  options?: {
    model?: string;
    maxOutputTokens?: number;
    temperature?: number;
    analytics?: AiAnalyticsContext;
    abortSignal?: AbortSignal;
  }
): Promise<{
  text: string;
  model: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number } | null;
}> {
  const client = getClient();
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, config.ai.requestTimeoutMs);
  const externalAbortSignal = options?.abortSignal;
  const handleExternalAbort = () => controller.abort();

  if (externalAbortSignal) {
    if (externalAbortSignal.aborted) {
      handleExternalAbort();
    } else {
      externalAbortSignal.addEventListener("abort", handleExternalAbort, { once: true });
    }
  }

  const analytics = options?.analytics;
  const model = options?.model?.trim() || config.ai.model;
  const isGpt5 = model.trim().toLowerCase().startsWith("gpt-5");
  const maxOutputTokens = options?.maxOutputTokens ?? config.ai.maxOutputTokens;
  const resolvedTemperature = options?.temperature ?? 0.4;
  const temperaturePayload = supportsCustomTemperature(model)
    ? { temperature: resolvedTemperature }
    : {};
  const posthogParams =
    analytics && openAiClientHasPostHog
      ? {
          posthogDistinctId: analytics.distinctId,
          posthogTraceId: analytics.traceId,
          posthogProperties: analytics.properties,
          posthogCaptureImmediate: true,
        }
      : {};

  try {
    let response;
    const requestPayload = {
      model,
      messages,
      max_completion_tokens: maxOutputTokens,
      ...temperaturePayload,
      ...posthogParams,
    };
    const requestOptions = {
      signal: controller.signal,
    };

    try {
      response = await client.chat.completions.create(requestPayload, requestOptions);
    } catch (error: unknown) {
      const shouldRetryWithoutPostHog =
        openAiClientHasPostHog &&
        !controller.signal.aborted;

      if (shouldRetryWithoutPostHog) {
        try {
          const fallbackClient = new OpenAI({ apiKey: config.ai.apiKey });
          const fallbackResponse = await fallbackClient.chat.completions.create(
            {
              model,
              messages,
              max_completion_tokens: maxOutputTokens,
              ...temperaturePayload,
            },
            requestOptions
          );
          console.warn(
            "[ai] PostHog OpenAI wrapper request failed; used plain OpenAI client for this request. Will retry PostHog wrapper next request."
          );
          response = fallbackResponse;
        } catch (retryError: unknown) {
          error = retryError;
        }
      }

      if (response) {
        // Fallback retry succeeded; continue using this response.
      } else {
        if (error instanceof APIConnectionTimeoutError) {
          throw new AiRequestError("AI provider timed out. Please try again.");
        }

        if (error instanceof APIConnectionError) {
          throw new AiRequestError("AI provider is unreachable right now. Please try again.");
        }

        if (error instanceof APIUserAbortError) {
          if (externalAbortSignal?.aborted && !timedOut) {
            throw new AiRequestError("AI request was canceled.");
          }

          if (controller.signal.aborted) {
            const timeoutSeconds = Math.ceil(config.ai.requestTimeoutMs / 1000);
            throw new AiRequestError(`AI request timed out after ${timeoutSeconds}s. Please try again.`);
          }
          throw new AiRequestError("AI request was aborted. Please retry.");
        }

        if (error instanceof APIError) {
          if (error.status === 401 || error.status === 403) {
            throw new AiRequestError("AI provider rejected authentication. Check OPENAI_API_KEY.");
          }
          if (error.status === 429) {
            throw new AiRequestError("AI provider rate limit reached. Please wait and try again.");
          }

          if (isAbortedProviderMessage(error.message)) {
            if (controller.signal.aborted) {
              const timeoutSeconds = Math.ceil(config.ai.requestTimeoutMs / 1000);
              throw new AiRequestError(`AI request timed out after ${timeoutSeconds}s. Please try again.`);
            }
            throw new AiRequestError("AI request was aborted. Please retry.");
          }

          const providerMessage =
            (typeof error.error === "object" &&
              error.error &&
              "message" in error.error &&
              typeof error.error.message === "string" &&
              error.error.message.trim().length > 0
              ? error.error.message.trim()
              : null) ??
            (typeof error.message === "string" && error.message.trim().length > 0
              ? error.message.trim()
              : null);

          if (providerMessage) {
            throw new AiRequestError(`AI provider error: ${providerMessage}`);
          }

          if (typeof error.status === "number") {
            throw new AiRequestError(`AI provider error (${error.status}).`);
          }

          throw new AiRequestError("AI provider error.");
        }

        if (error instanceof Error && error.name === "AbortError") {
          if (externalAbortSignal?.aborted && !timedOut) {
            throw new AiRequestError("AI request was canceled.");
          }
          throw new AiRequestError("AI request timed out.");
        }

        if (error instanceof Error && error.message.trim().length > 0) {
          throw new AiRequestError(`AI request failed: ${error.message.trim()}`);
        }

        throw new AiRequestError("AI request failed due to an unexpected provider error.");
      }
    }

    const refusalMessage =
      typeof response.choices?.[0]?.message?.refusal === "string"
        ? response.choices[0].message.refusal.trim()
        : "";
    let text = extractTextFromResponse(response);
    if (!text && !controller.signal.aborted) {
      try {
        const fallbackClient = new OpenAI({ apiKey: config.ai.apiKey });
        const retryResponse = await fallbackClient.chat.completions.create(
          {
            ...requestPayload,
            // gpt-5 models sometimes spend more tokens before producing final text.
            max_completion_tokens: isGpt5 ? Math.max(maxOutputTokens, 900) : maxOutputTokens,
          },
          requestOptions
        );
        const retryText = extractTextFromResponse(retryResponse);
        if (retryText) {
          response = retryResponse;
          text = retryText;
          if (openAiClientHasPostHog) {
            console.warn(
              "[ai] Empty response from PostHog-wrapped client; used plain OpenAI client for this request. Will retry PostHog wrapper next request."
            );
          }
        }
      } catch {
        // Preserve original empty-response handling below.
      }
    }

    if (!text) {
      if (refusalMessage) {
        throw new AiRequestError(`AI response was blocked: ${refusalMessage}`);
      }
      const finishReason = (response as { choices?: Array<{ finish_reason?: string | null }> })
        ?.choices?.[0]?.finish_reason;
      const finishSuffix =
        typeof finishReason === "string" && finishReason.length > 0
          ? ` (finish reason: ${finishReason})`
          : "";
      throw new AiRequestError(
        `AI provider returned an empty response${finishSuffix}. Please try again.`
      );
    }

    return {
      text,
      model: response.model,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens ?? 0,
            completionTokens: response.usage.completion_tokens ?? 0,
            totalTokens: response.usage.total_tokens ?? 0,
          }
        : null,
    };
  } finally {
    clearTimeout(timeout);
    if (externalAbortSignal) {
      externalAbortSignal.removeEventListener("abort", handleExternalAbort);
    }
  }
}
