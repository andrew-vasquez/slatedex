import * as Sentry from "@sentry/tanstackstart-react";
import { useLocation } from "@tanstack/react-router";
import { Bug, Check, Lightbulb, MessageSquareMore, Send, Sparkles, X } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";

type FeedbackKind = "bug" | "feature" | "other";

type FeedbackContextValue = {
  openFeedback: () => void;
};

const FEEDBACK_OPTIONS: Array<{
  value: FeedbackKind;
  label: string;
  description: string;
  icon: typeof Bug;
}> = [
  {
    value: "bug",
    label: "Bug report",
    description: "Something is broken or confusing.",
    icon: Bug,
  },
  {
    value: "feature",
    label: "Feature idea",
    description: "Something you wish Slatedex could do.",
    icon: Lightbulb,
  },
  {
    value: "other",
    label: "General feedback",
    description: "Anything else you want to share.",
    icon: MessageSquareMore,
  },
];

const MESSAGE_PLACEHOLDERS: Record<FeedbackKind, string> = {
  bug: "What happened, what did you expect, and what page were you on?",
  feature: "What would you like to be able to do, and why would it help?",
  other: "Tell us what is working well, what feels off, or what you want us to improve.",
};

const FEEDBACK_TITLES: Record<FeedbackKind, string> = {
  bug: "Bug report",
  feature: "Feature idea",
  other: "General feedback",
};

const FeedbackContext = createContext<FeedbackContextValue>({
  openFeedback: () => {},
});

export function useFeedback() {
  return useContext(FeedbackContext);
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [kind, setKind] = useState<FeedbackKind>("bug");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">("idle");
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const routePath = location.pathname;

  useEffect(() => {
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
  }, [user?.email, user?.name]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      textareaRef.current?.focus();
    }, 30);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const openFeedback = () => {
    setSubmitState("idle");
    setSubmitMessage(null);
    setIsOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsOpen(false);
    setSubmitState("idle");
    setSubmitMessage(null);
  };

  const resetForm = () => {
    setKind("bug");
    setMessage("");
    setSubmitState("idle");
    setSubmitMessage(null);
    setName(user?.name ?? "");
    setEmail(user?.email ?? "");
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      setSubmitState("error");
      setSubmitMessage("Add a few details before sending.");
      return;
    }

    setIsSubmitting(true);
    setSubmitState("idle");
    setSubmitMessage(null);

    try {
      if (typeof window === "undefined") {
        throw new Error("Feedback can only be submitted from the browser.");
      }

      if (!Sentry.getClient() || !Sentry.getFeedback()) {
        throw new Error("Sentry feedback integration is not initialized.");
      }

      const pageUrl = typeof window === "undefined" ? routePath : window.location.href;

      const feedbackEventId = Sentry.captureFeedback(
        {
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          message: `[${FEEDBACK_TITLES[kind]}]\nPage: ${pageUrl}\n\n${trimmedMessage}`,
        },
        {
          captureContext: {
            tags: {
              feedback_kind: kind,
              feedback_source: "custom-feedback-modal",
            },
            contexts: {
              feedback: {
                route: routePath,
                page_url: pageUrl,
              },
            },
          },
        }
      );

      await Sentry.flush(2000);

      setSubmitState("success");
      setSubmitMessage(
        feedbackEventId
          ? "Thanks. Your feedback was sent to the Slatedex team."
          : "Feedback was queued, but Sentry did not return an event id."
      );
      setMessage("");
    } catch (error) {
      Sentry.captureException(error);
      setSubmitState("error");
      setSubmitMessage("We couldn't send your feedback right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FeedbackContext value={{ openFeedback }}>
      {children}
      {isOpen ? (
        <div className="fixed inset-0 z-[96] flex items-end justify-center p-3 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="feedback-modal-title">
          <button
            type="button"
            onClick={closeModal}
            className="absolute inset-0 bg-[rgba(20,16,12,0.52)] backdrop-blur-[3px]"
            aria-label="Close feedback dialog"
          />

          <section className="panel animate-scale-in relative z-[1] flex w-full max-w-2xl flex-col overflow-hidden p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div
                  className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl"
                  style={{
                    background: "var(--accent-soft)",
                    border: "1px solid color-mix(in srgb, var(--accent) 36%, transparent)",
                    color: "var(--accent)",
                  }}
                >
                  <MessageSquareMore size={18} aria-hidden="true" />
                </div>
                <h2 id="feedback-modal-title" className="font-display text-xl" style={{ color: "var(--text-primary)" }}>
                  Share feedback
                </h2>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Report bugs, request features, or tell us what would make Slatedex more useful.
                </p>
              </div>

              <button type="button" onClick={closeModal} className="btn-secondary shrink-0" aria-label="Close feedback dialog">
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-2 sm:grid-cols-3">
                {FEEDBACK_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = kind === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setKind(option.value)}
                      className="rounded-2xl border px-3 py-3 text-left transition"
                      style={{
                        borderColor: isActive ? "color-mix(in srgb, var(--accent) 48%, var(--border))" : "var(--border)",
                        background: isActive ? "color-mix(in srgb, var(--accent-soft) 78%, var(--surface-1))" : "var(--surface-2)",
                        color: "var(--text-primary)",
                      }}
                      aria-pressed={isActive}
                    >
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Icon size={16} aria-hidden="true" />
                        {option.label}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: isActive ? "var(--text-secondary)" : "var(--text-muted)" }}>
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm">
                  <span style={{ color: "var(--text-secondary)" }}>Name</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition"
                    style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-primary)" }}
                  />
                </label>

                <label className="space-y-1.5 text-sm">
                  <span style={{ color: "var(--text-secondary)" }}>Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Optional"
                    className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none transition"
                    style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-primary)" }}
                  />
                </label>
              </div>

              <label className="block space-y-1.5 text-sm">
                <span style={{ color: "var(--text-secondary)" }}>What should we know?</span>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={MESSAGE_PLACEHOLDERS[kind]}
                  rows={6}
                  className="w-full resize-y rounded-2xl border px-3 py-3 text-sm outline-none transition"
                  style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-primary)" }}
                  required
                />
              </label>

              <div className="rounded-2xl border px-3 py-2.5 text-xs" style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: "var(--text-muted)" }}>
                Sent with page context from <span style={{ color: "var(--text-secondary)" }}>{routePath}</span>
              </div>

              {submitState === "success" ? (
                <div
                  className="relative overflow-hidden rounded-[1.4rem] border p-5 sm:p-6"
                  style={{
                    borderColor: "rgba(34, 197, 94, 0.2)",
                    background:
                      "radial-gradient(circle at top left, rgba(34, 197, 94, 0.16), transparent 42%), radial-gradient(circle at bottom right, rgba(218, 44, 67, 0.14), transparent 38%), linear-gradient(180deg, color-mix(in srgb, var(--surface-2) 92%, transparent), color-mix(in srgb, var(--surface-1) 94%, transparent))",
                  }}
                >
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[rgba(255,255,255,0.04)] blur-2xl" aria-hidden="true" />
                  <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border"
                        style={{
                          borderColor: "rgba(34, 197, 94, 0.28)",
                          background: "rgba(34, 197, 94, 0.14)",
                          color: "#b6f3c6",
                        }}
                      >
                        <Check size={20} aria-hidden="true" />
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em]" style={{ borderColor: "rgba(255,255,255,0.08)", color: "#d7fbe1", background: "rgba(255,255,255,0.03)" }}>
                          <Sparkles size={12} aria-hidden="true" />
                          Received
                        </div>
                        <h3 className="mt-3 text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                          Feedback sent
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                          {submitMessage ?? "Thanks. Your note is now in the Slatedex feedback queue."}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:min-w-[11rem]">
                      <button type="button" onClick={closeModal} className="inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold" style={{ background: "var(--accent)", color: "white" }}>
                        Done
                      </button>
                      <button type="button" onClick={resetForm} className="btn-secondary">
                        Send another
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {submitMessage ? (
                    <div
                      className="rounded-2xl border px-3 py-2.5 text-sm"
                      style={{
                        borderColor: "rgba(218, 44, 67, 0.24)",
                        background: "rgba(218, 44, 67, 0.08)",
                        color: "#ffb3c1",
                      }}
                    >
                      {submitMessage}
                    </div>
                  ) : null}

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <button type="button" onClick={resetForm} className="btn-secondary" disabled={isSubmitting}>
                      Reset
                    </button>

                    <div className="flex flex-col-reverse gap-2 sm:flex-row">
                      <button type="button" onClick={closeModal} className="btn-secondary" disabled={isSubmitting}>
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
                        style={{ background: "var(--accent)", color: "white" }}
                        disabled={isSubmitting}
                      >
                        <Send size={15} aria-hidden="true" />
                        {isSubmitting ? "Sending..." : "Send feedback"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </form>
          </section>
        </div>
      ) : null}
    </FeedbackContext>
  );
}
