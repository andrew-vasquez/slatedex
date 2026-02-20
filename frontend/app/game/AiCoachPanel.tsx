"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowRight,
  FiArrowUp,
  FiCompass,
  FiLoader,
  FiMessageCircle,
  FiX,
  FiZap,
} from "react-icons/fi";
import { analyzeAiTeam, fetchAiMessages, sendAiChat, type AiMessage } from "@/lib/api";
import { useAnimatedUnmount } from "@/app/game/hooks/useAnimatedUnmount";
import type { DexMode, Pokemon } from "@/lib/types";

function PokeballIcon({ className, size = 18 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M2,50 H38 A12,12 0 0,0 62,50 H98" fill="none" stroke="currentColor" strokeWidth="4" />
      <path d="M2,50 H38 A12,12 0 0,1 62,50 H98" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="50" cy="50" r="8" fill="currentColor" />
      <circle cx="50" cy="50" r="4" fill="var(--surface-1)" />
    </svg>
  );
}

interface AiCoachPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  teamHasPokemon: boolean;
  team: (Pokemon | null)[];
  generation: number;
  gameId: number;
  selectedVersionId: string;
  selectedVersionLabel: string;
  dexMode: DexMode;
  versionFilterEnabled: boolean;
  typeFilter: string[];
  regionalDexName: string | null;
  allowedPokemonNames: string[];
  activeTeamId: string | null;
  boundTeamId: string | null;
  onBindTeamId: (teamId: string | null) => void;
}

function appendUniqueMessages(current: AiMessage[], incoming: AiMessage[]): AiMessage[] {
  const seen = new Set(current.map((message) => message.id));
  const merged = [...current];
  for (const message of incoming) {
    if (seen.has(message.id)) continue;
    seen.add(message.id);
    merged.push(message);
  }
  return merged;
}

export default function AiCoachPanel({
  isOpen,
  onClose,
  isAuthenticated,
  teamHasPokemon,
  team,
  generation,
  gameId,
  selectedVersionId,
  selectedVersionLabel,
  dexMode,
  versionFilterEnabled,
  typeFilter,
  regionalDexName,
  allowedPokemonNames,
  activeTeamId,
  boundTeamId,
  onBindTeamId,
}: AiCoachPanelProps) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [revealedLength, setRevealedLength] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useRef(false);

  const effectiveTeamId = useMemo(() => boundTeamId ?? activeTeamId, [activeTeamId, boundTeamId]);
  const canInteract = isAuthenticated && teamHasPokemon && !isSending && !isAnalyzing;
  const filledTeamSize = useMemo(() => team.filter(Boolean).length, [team]);
  const hasFullParty = filledTeamSize === 6;
  const canAnalyze = canInteract && hasFullParty;
  const showAllowedPool = dexMode === "regional" || versionFilterEnabled;

  const { shouldRender, isAnimatingOut, onAnimationEnd } = useAnimatedUnmount(isOpen, 340);

  const quickPrompts = useMemo(
    () => [
      { label: "Swap ideas", text: "Give me 2 legal swap ideas based on my current filters." },
      { label: "Boss strategy", text: "What is my safest gameplan for the next major boss fight?" },
      { label: "Fix weakness", text: "Where is this team weakest and what is one fix?" },
    ],
    []
  );

  // Detect desktop vs mobile for animation direction
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);

    prefersReducedMotion.current =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.dataset.motion === "reduced";

    return () => query.removeEventListener("change", update);
  }, []);

  // Typewriter effect — reveal assistant message word-by-word
  useEffect(() => {
    if (!typingMessageId) return;

    const msg = messages.find((m) => m.id === typingMessageId);
    if (!msg) {
      setTypingMessageId(null);
      return;
    }

    if (prefersReducedMotion.current) {
      setRevealedLength(msg.content.length);
      setTypingMessageId(null);
      return;
    }

    const totalLen = msg.content.length;
    let current = 0;

    const tick = () => {
      const progress = current / totalLen;
      // Speed curve: faster as we go
      const chunkSize = progress > 0.9 ? totalLen - current : progress > 0.6 ? 18 : 12;

      // Advance to the next word boundary after chunkSize chars
      let next = Math.min(current + chunkSize, totalLen);
      if (next < totalLen) {
        const spaceIdx = msg.content.indexOf(" ", next);
        next = spaceIdx === -1 ? totalLen : spaceIdx + 1;
      }

      current = next;
      setRevealedLength(current);

      if (current >= totalLen) {
        setTypingMessageId(null);
      }
    };

    // Kick off first chunk immediately
    tick();

    if (current >= totalLen) return;

    const interval = setInterval(() => {
      requestAnimationFrame(tick);
    }, 35);

    return () => clearInterval(interval);
  }, [typingMessageId, messages]);

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;

    const frame = requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  // Auto-scroll to latest message
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const latestMessageId = messages[messages.length - 1]?.id ?? "";
  const autoScrollKey = useMemo(
    () =>
      `${isOpen ? 1 : 0}:${isLoadingHistory ? 1 : 0}:${latestMessageId}:${isSending ? 1 : 0}:${isAnalyzing ? 1 : 0}:${typingMessageId ?? ""}`,
    [isOpen, isLoadingHistory, latestMessageId, isSending, isAnalyzing, typingMessageId]
  );

  useEffect(() => {
    if (!isOpen || isLoadingHistory) return;
    if (messages.length === 0 && !isSending && !isAnalyzing) return;

    let raf1 = 0;
    let raf2 = 0;
    raf1 = requestAnimationFrame(() => {
      scrollToBottom();
      raf2 = requestAnimationFrame(() => {
        scrollToBottom();
      });
    });

    const timeout = window.setTimeout(() => {
      scrollToBottom();
    }, 220);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      window.clearTimeout(timeout);
    };
  }, [autoScrollKey, scrollToBottom]);

  // Load history
  useEffect(() => {
    if (!isAuthenticated || !effectiveTeamId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setIsLoadingHistory(true);
    setError(null);

    fetchAiMessages(effectiveTeamId)
      .then((result) => {
        if (cancelled) return;
        setMessages(result.messages);
      })
      .catch((loadError: unknown) => {
        if (cancelled) return;
        const message = loadError instanceof Error ? loadError.message : "Could not load AI chat history.";
        if (message.toLowerCase().includes("team not found")) {
          onBindTeamId(null);
        }
        setError(message);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingHistory(false);
      });

    return () => {
      cancelled = true;
    };
  }, [effectiveTeamId, isAuthenticated]);

  // Auto-resize textarea
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, []);

  async function handleSend(messageOverride?: string) {
    const message = (messageOverride ?? input).trim();
    if (!message || !canInteract) return;

    setIsSending(true);
    setError(null);
    try {
      const result = await sendAiChat({
        teamId: effectiveTeamId ?? undefined,
        generation,
        gameId,
        selectedVersionId: selectedVersionId || null,
        team,
        dexMode,
        versionFilterEnabled,
        typeFilter,
        regionalDexName,
        allowedPokemonNames: showAllowedPool ? allowedPokemonNames : undefined,
        message,
      });

      onBindTeamId(result.teamId);
      setMessages((current) =>
        appendUniqueMessages(current, [result.userMessage, result.assistantMessage])
      );
      setRevealedLength(0);
      setTypingMessageId(result.assistantMessage.id);
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (sendError: unknown) {
      const messageText = sendError instanceof Error ? sendError.message : "Could not send message.";
      if (messageText.toLowerCase().includes("team not found")) {
        onBindTeamId(null);
      }
      setError(messageText);
    } finally {
      setIsSending(false);
    }
  }

  async function handleAnalyze() {
    if (!canAnalyze) return;

    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await analyzeAiTeam({
        teamId: effectiveTeamId ?? undefined,
        generation,
        gameId,
        selectedVersionId: selectedVersionId || null,
        team,
        dexMode,
        versionFilterEnabled,
        typeFilter,
        regionalDexName,
        allowedPokemonNames: showAllowedPool ? allowedPokemonNames : undefined,
      });

      onBindTeamId(result.teamId);
      setMessages((current) =>
        appendUniqueMessages(current, [result.userMessage, result.assistantMessage])
      );
      setRevealedLength(0);
      setTypingMessageId(result.assistantMessage.id);
    } catch (analyzeError: unknown) {
      const messageText = analyzeError instanceof Error ? analyzeError.message : "Could not analyze team.";
      if (messageText.toLowerCase().includes("team not found")) {
        onBindTeamId(null);
      }
      setError(messageText);
    } finally {
      setIsAnalyzing(false);
    }
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
      }
    },
    [canInteract, input, effectiveTeamId, generation, gameId, selectedVersionId, team, dexMode, versionFilterEnabled, typeFilter, regionalDexName, allowedPokemonNames, showAllowedPool]
  );

  if (!shouldRender) return null;

  const animClass = isDesktop
    ? isAnimatingOut ? "ai-drawer-desktop-out" : "ai-drawer-desktop-in"
    : isAnimatingOut ? "ai-drawer-mobile-out" : "ai-drawer-mobile-in";

  // Gate content
  const showGate = !isAuthenticated || !teamHasPokemon;
  const gateMessage = !isAuthenticated
    ? "Sign in to use AI Coach chat and team analysis."
    : "Add at least one Pokemon to your team before using AI Coach.";

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="AI Coach">
      {/* Backdrop */}
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0"
        style={{
          background: "rgba(2, 5, 16, 0.55)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          animation: isAnimatingOut ? "backdropFadeOut 200ms ease-in both" : "backdropFadeIn 220ms ease-out both",
        }}
        aria-label="Close AI Coach"
      />

      {/* Drawer */}
      <section
        ref={drawerRef}
        tabIndex={-1}
        className={`ai-drawer ${animClass} fixed ${
          isDesktop
            ? "right-0 top-0 bottom-0 w-full max-w-[26rem]"
            : "inset-0"
        }`}
        onAnimationEnd={onAnimationEnd}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, var(--version-color-soft, rgba(218,44,67,0.2)) 0%, transparent 100%)",
                border: "1px solid var(--version-color-border, rgba(218,44,67,0.25))",
              }}
            >
              <FiMessageCircle size={15} style={{ color: "var(--version-color, var(--accent))" }} />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                AI Coach
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="text-[0.64rem] font-medium" style={{ color: "var(--text-muted)" }}>
                  Gen {generation}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.5rem" }}>·</span>
                <span className="text-[0.64rem] font-medium" style={{ color: "var(--text-muted)" }}>
                  {selectedVersionLabel}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.5rem" }}>·</span>
                <span className="text-[0.64rem] font-medium" style={{ color: "var(--text-muted)" }}>
                  {filledTeamSize}/6
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
            style={{
              border: "1px solid var(--border)",
              background: "var(--surface-2)",
              color: "var(--text-secondary)",
            }}
            aria-label="Close"
          >
            <FiX size={15} />
          </button>
        </div>

        {showGate ? (
          /* ── Gate: not authenticated or no team ── */
          <div className="flex flex-1 items-center justify-center p-6">
            <div className="max-w-[16rem] text-center">
              <div
                className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                }}
              >
                <FiCompass size={22} style={{ color: "var(--text-muted)" }} />
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {gateMessage}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Messages area ── */}
            <div className="ai-drawer-messages min-h-0 px-4 py-4 sm:px-5">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <FiLoader size={18} className="animate-spin" style={{ color: "var(--text-muted)" }} />
                  <span className="ml-2 text-sm" style={{ color: "var(--text-muted)" }}>
                    Loading history...
                  </span>
                </div>
              ) : messages.length === 0 ? (
                /* ── Empty state with quick prompts ── */
                <div className="flex h-full flex-col items-center justify-center">
                  <div className="max-w-[18rem] text-center">
                    <div
                      className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                      style={{
                        background: "linear-gradient(135deg, var(--version-color-soft, rgba(218,44,67,0.14)) 0%, transparent 100%)",
                        border: "1px solid var(--version-color-border, rgba(218,44,67,0.2))",
                      }}
                    >
                      <FiZap size={24} style={{ color: "var(--version-color, var(--accent))" }} />
                    </div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      How can I help with your team?
                    </p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      Ask about matchups, swaps, or tap Analyze below.
                    </p>
                  </div>

                  <div className="mt-6 flex w-full flex-col gap-2">
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt.label}
                        type="button"
                        onClick={() => void handleSend(prompt.text)}
                        disabled={!canInteract}
                        className="ai-quick-prompt"
                      >
                        <FiArrowRight size={13} style={{ flexShrink: 0, color: "var(--text-muted)" }} />
                        {prompt.text}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* ── Message list ── */
                <div className="space-y-3">
                  {messages.map((message) => {
                    const isAssistant = message.role === "assistant";
                    const isTyping = message.id === typingMessageId;
                    const displayContent = isTyping
                      ? message.content.slice(0, revealedLength)
                      : message.content;

                    return (
                      <div
                        key={message.id}
                        className={`ai-message-enter flex ${isAssistant ? "justify-start" : "justify-end"}`}
                      >
                        <article
                          className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[0.82rem] leading-relaxed ${
                            isAssistant ? "rounded-tl-md" : "rounded-tr-md"
                          }`}
                          style={{
                            background: isAssistant ? "var(--surface-2)" : "var(--version-color-soft, rgba(218,44,67,0.12))",
                            border: `1px solid ${isAssistant ? "var(--border)" : "var(--version-color-border, rgba(218,44,67,0.22))"}`,
                            color: "var(--text-primary)",
                          }}
                        >
                          {isAssistant && (
                            <p
                              className="mb-1 flex items-center gap-1 text-[0.62rem] font-semibold uppercase tracking-[0.08em]"
                              style={{ color: "var(--accent)" }}
                            >
                              <FiMessageCircle size={9} />
                              Coach
                            </p>
                          )}
                          <p className={`whitespace-pre-wrap${isTyping ? " ai-typing-cursor" : ""}`}>
                            {displayContent}
                          </p>
                        </article>
                      </div>
                    );
                  })}

                  {/* Thinking indicator */}
                  {(isSending || isAnalyzing) && (
                    <div className="ai-message-enter flex justify-start">
                      <div
                        className="flex max-w-[88%] items-center gap-2.5 rounded-2xl rounded-tl-md px-3.5 py-2.5"
                        style={{
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <PokeballIcon
                          size={16}
                          className="ai-thinking-pokeball"
                        />
                        <span
                          className="text-[0.78rem] font-medium"
                          style={{ color: "var(--text-muted)" }}
                        >
                          Coach is thinking
                        </span>
                        <span className="ai-thinking-dots flex items-center gap-[3px]">
                          <span />
                          <span />
                          <span />
                        </span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* ── Error ── */}
            {error && (
              <div className="px-4 sm:px-5">
                <p
                  className="mb-1 rounded-lg px-3 py-2 text-xs"
                  style={{
                    background: "rgba(185, 28, 28, 0.12)",
                    border: "1px solid rgba(185, 28, 28, 0.25)",
                    color: "#fca5a5",
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            {/* ── Input area ── */}
            <div className="ai-drawer-input-area">
              {/* Analyze button */}
              <button
                type="button"
                onClick={() => void handleAnalyze()}
                disabled={!canAnalyze}
                className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: canAnalyze
                    ? "linear-gradient(135deg, var(--version-color-soft, rgba(218,44,67,0.15)) 0%, transparent 100%)"
                    : "linear-gradient(135deg, rgba(107,114,128,0.18) 0%, rgba(107,114,128,0.08) 100%)",
                  border: canAnalyze
                    ? "1px solid var(--version-color-border, rgba(218,44,67,0.25))"
                    : "1px solid rgba(107,114,128,0.28)",
                  color: canAnalyze ? "var(--text-secondary)" : "var(--text-muted)",
                }}
              >
                {isAnalyzing ? (
                  <FiLoader size={13} className="animate-spin" />
                ) : (
                  <FiZap size={13} style={{ color: canAnalyze ? "var(--accent)" : "var(--text-muted)" }} />
                )}
                {isAnalyzing ? "Analyzing..." : "Analyze My Team"}
              </button>
              {!hasFullParty && (
                <p className="mb-2.5 text-center text-[0.68rem]" style={{ color: "var(--text-muted)" }}>
                  Add 6 party members to use Analyze My Team ({filledTeamSize}/6).
                </p>
              )}

              {/* Chat input */}
              <div className="ai-drawer-input-wrap">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Ask about threats, swaps, roles..."
                  disabled={!canInteract}
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={!canInteract || !input.trim()}
                  className="ai-drawer-send-btn"
                  aria-label="Send message"
                >
                  {isSending ? <FiLoader size={14} className="animate-spin" /> : <FiArrowUp size={16} strokeWidth={2.5} />}
                </button>
              </div>

              <p className="mt-2 text-center text-[0.62rem]" style={{ color: "var(--text-muted)" }}>
                Suggestions follow your active filters and gen rules. Press Enter to send.
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
