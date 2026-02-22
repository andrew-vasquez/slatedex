"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiArrowUp,
  FiCompass,
  FiCopy,
  FiDownload,
  FiLoader,
  FiMessageCircle,
  FiSearch,
  FiSidebar,
  FiSquare,
  FiX,
  FiZap,
} from "react-icons/fi";
import {
  ApiError,
  analyzeAiTeam,
  fetchAiMessages,
  fetchAiUsage,
  sendAiChat,
  type AiMessage,
  type AiUsageSnapshot,
  type TeamStoryCheckpoint,
} from "@/lib/api";
import { triggerHaptic } from "@/lib/haptics";
import { useAnimatedUnmount } from "@/app/game/hooks/useAnimatedUnmount";
import type { DexMode, Pokemon } from "@/lib/types";
import { normalizeLookupToken } from "./ai/aiMessageParser";
import { useAiCheckpoint } from "./ai/useAiCheckpoint";
import AiCheckpointSelector from "./ai/AiCheckpointSelector";
import AiMessageList from "./ai/AiMessageList";

interface AiCoachPanelProps {
  isOpen: boolean;
  onClose: () => void;
  headerOffsetPx?: number;
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
  versionScopedPokemonPool: Pokemon[];
  teamCheckpoint: TeamStoryCheckpoint | null;
  onTeamCheckpointChange: (checkpoint: TeamStoryCheckpoint | null) => Promise<void>;
  activeTeamId: string | null;
  boundTeamId: string | null;
  onBindTeamId: (teamId: string | null) => void;
  hapticsEnabled?: boolean;
}

type QueuedAiTask =
  | { id: string; kind: "chat"; message: string }
  | { id: string; kind: "analyze" };

type QueueTaskInput =
  | { kind: "chat"; message: string }
  | { kind: "analyze" };

interface SlashCommandDefinition {
  id: string;
  description: string;
  task: QueueTaskInput;
}

const SLASH_COMMANDS: SlashCommandDefinition[] = [
  { id: "analyze", description: "Run full team analysis", task: { kind: "analyze" } },
  { id: "swap", description: "Suggest legal swap options", task: { kind: "chat", message: "Give me 3 legal swap ideas based on this team and current filters." } },
  { id: "threats", description: "Scan top matchup threats", task: { kind: "chat", message: "What are the biggest threats to this team, and what adjustments should I make?" } },
  { id: "boss", description: "Plan for next major boss", task: { kind: "chat", message: "What is my safest gameplan for the next major boss fight?" } },
  { id: "coverage", description: "Score defensive and offensive coverage", task: { kind: "chat", message: "Give this team a quick defensive and offensive coverage grade, then suggest one improvement." } },
  { id: "speed", description: "Audit speed control and tempo", task: { kind: "chat", message: "Evaluate this team's speed control and tempo plan, then suggest one speed-focused upgrade." } },
  { id: "lead", description: "Recommend lead and pivot plan", task: { kind: "chat", message: "Recommend my best default lead and first pivot line for most matchups in this run." } },
];

const CHAT_INPUT_MAX_HEIGHT = 96;
const DRAWER_MIN_WIDTH = 352;
const DRAWER_MAX_WIDTH = 800;
const DRAWER_DEFAULT_WIDTH = 416;
const DRAWER_WIDTH_KEY = "ai_coach_drawer_width";
const DRAWER_PINNED_KEY = "ai_coach_pinned";

function exportMessagesAsMarkdown(msgs: AiMessage[], gen: number, versionLabel: string): void {
  const lines = [
    `# AI Coach — Gen ${gen} · ${versionLabel}`,
    `> Exported ${new Date().toLocaleString()}`,
    "",
  ];
  for (const msg of msgs) {
    const role = msg.role === "assistant" ? "**Coach**" : "**You**";
    const time = msg.createdAt ? ` _${new Date(msg.createdAt).toLocaleString()}_` : "";
    lines.push(`### ${role}${time}`, "", msg.content, "");
  }
  const blob = new Blob([lines.join("\n")], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ai-coach-gen${gen}-${versionLabel.toLowerCase().replace(/\s+/g, "-")}.md`;
  a.click();
  URL.revokeObjectURL(url);
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

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
}

function formatResetDate(iso?: string | null): string {
  if (!iso) return "next month";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "next month";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function coerceUsageSnapshot(value: unknown): AiUsageSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<AiUsageSnapshot>;
  if (
    typeof candidate.periodStart !== "string" ||
    typeof candidate.resetsAt !== "string" ||
    !candidate.chat ||
    !candidate.analyze
  ) {
    return null;
  }
  return candidate as AiUsageSnapshot;
}

export default function AiCoachPanel({
  isOpen,
  onClose,
  headerOffsetPx = 0,
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
  versionScopedPokemonPool,
  teamCheckpoint,
  onTeamCheckpointChange,
  activeTeamId,
  boundTeamId,
  onBindTeamId,
  hapticsEnabled = true,
}: AiCoachPanelProps) {
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [queuedTasks, setQueuedTasks] = useState<QueuedAiTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [revealedLength, setRevealedLength] = useState(0);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [draftBeforeHistoryNav, setDraftBeforeHistoryNav] = useState("");
  const [activeSlashIndex, setActiveSlashIndex] = useState(0);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [collapsedMessages, setCollapsedMessages] = useState<Set<string>>(() => new Set());
  const [drawerWidth, setDrawerWidth] = useState(() => {
    if (typeof window === "undefined") return DRAWER_DEFAULT_WIDTH;
    const stored = localStorage.getItem(DRAWER_WIDTH_KEY);
    return stored ? Math.min(DRAWER_MAX_WIDTH, Math.max(DRAWER_MIN_WIDTH, Number(stored))) : DRAWER_DEFAULT_WIDTH;
  });
  const [isPinned, setIsPinned] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(DRAWER_PINNED_KEY) === "true";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(() => new Set());
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [usageSnapshot, setUsageSnapshot] = useState<AiUsageSnapshot | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [swipeDragOffset, setSwipeDragOffset] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useRef(false);
  const shouldFollowMessagesRef = useRef(true);
  const activeRequestAbortRef = useRef<AbortController | null>(null);
  const resizeStartXRef = useRef<number | null>(null);
  const resizeStartWidthRef = useRef(DRAWER_DEFAULT_WIDTH);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const swipeTouchStartY = useRef<number | null>(null);
  const swipeTouchLastY = useRef<number | null>(null);
  const swipeTouchLastTime = useRef(0);
  const swipeVelocity = useRef(0);

  const emitHaptic = useCallback(
    (tone: Parameters<typeof triggerHaptic>[0] = "light") => {
      triggerHaptic(tone, { enabled: hapticsEnabled, mobileOnly: true });
    },
    [hapticsEnabled]
  );

  const {
    bossGuidanceLoading,
    checkpointOptions,
    selectedCheckpoint,
    checkpointPendingLabel,
    checkpointCatchables,
    checkpointKeySelection,
    checkpointDropdownOpen,
    checkpointDropdownRef,
    setCheckpointDropdownOpen,
    handleCheckpointSelection,
  } = useAiCheckpoint({
    isOpen,
    isAuthenticated,
    selectedVersionId,
    teamCheckpoint,
    onTeamCheckpointChange,
    versionScopedPokemonPool,
    onError: setError,
  });

  const effectiveTeamId = useMemo(() => boundTeamId ?? activeTeamId, [activeTeamId, boundTeamId]);
  const canUseAi = isAuthenticated && teamHasPokemon;
  const isBusy = isSending || isAnalyzing;
  const filledTeamSize = useMemo(() => team.filter(Boolean).length, [team]);
  const hasFullParty = filledTeamSize === 6;
  const canSendChatByQuota = useMemo(() => {
    if (!usageSnapshot) return true;
    if (usageSnapshot.chat.unlimited) return true;
    return (usageSnapshot.chat.remaining ?? 0) > 0;
  }, [usageSnapshot]);
  const canAnalyzeByQuota = useMemo(() => {
    if (!usageSnapshot) return true;
    if (usageSnapshot.analyze.unlimited) return true;
    return (usageSnapshot.analyze.remaining ?? 0) > 0;
  }, [usageSnapshot]);
  const canSendChat = canUseAi && canSendChatByQuota;
  const canAnalyze = canUseAi && hasFullParty && canAnalyzeByQuota;
  const showAllowedPool = dexMode === "regional" || versionFilterEnabled;

  const pokemonNameLookup = useMemo(() => {
    const names = new Set<string>();
    team.forEach((member) => {
      if (!member?.name) return;
      names.add(normalizeLookupToken(member.name));
    });
    allowedPokemonNames.forEach((name) => {
      const normalized = normalizeLookupToken(name);
      if (normalized) names.add(normalized);
    });
    return names;
  }, [team, allowedPokemonNames]);

  const { shouldRender, isAnimatingOut, onAnimationEnd } = useAnimatedUnmount(isOpen, 340);
  const safeHeaderOffsetPx = Math.max(0, Math.round(headerOffsetPx));

  const quickCommandChips = useMemo(
    () => [
      { id: "analyze", label: "/analyze", description: "Run full team analysis now" },
      { id: "swap", label: "/swap", description: "Ask for legal swap ideas" },
      { id: "threats", label: "/threats", description: "Scan major matchup threats" },
      { id: "boss", label: "/boss", description: "Plan your next major boss fight" },
    ],
    []
  );
  const userMessageHistory = useMemo(
    () =>
      messages
        .filter((message) => message.role === "user")
        .map((message) => message.content.trim())
        .filter(Boolean),
    [messages]
  );
  const slashQuery = useMemo(() => {
    const trimmed = input.trimStart();
    if (!trimmed.startsWith("/")) return null;
    const firstLine = trimmed.split("\n", 1)[0];
    const token = firstLine.slice(1);
    if (token.includes(" ")) return null;
    return token.toLowerCase();
  }, [input]);
  const filteredSlashCommands = useMemo(() => {
    if (slashQuery === null) return [];
    if (!slashQuery) return SLASH_COMMANDS;
    return SLASH_COMMANDS.filter((command) => command.id.startsWith(slashQuery));
  }, [slashQuery]);
  const isSlashMenuOpen = canUseAi && filteredSlashCommands.length > 0;

  const searchFilteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;
    const q = searchQuery.toLowerCase();
    return messages.filter((m) => m.content.toLowerCase().includes(q));
  }, [messages, searchQuery]);

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

  useEffect(() => {
    if (!isOpen || !isAuthenticated) {
      setUsageSnapshot(null);
      setUsageLoading(false);
      return;
    }

    let cancelled = false;
    setUsageLoading(true);

    fetchAiUsage()
      .then((snapshot) => {
        if (cancelled) return;
        setUsageSnapshot(snapshot);
      })
      .catch(() => {
        if (cancelled) return;
        setUsageSnapshot(null);
      })
      .finally(() => {
        if (!cancelled) setUsageLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isOpen]);

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
      const chunkSize = progress > 0.9 ? totalLen - current : progress > 0.6 ? 18 : 12;

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

    tick();

    if (current >= totalLen) return;

    const interval = setInterval(() => {
      requestAnimationFrame(tick);
    }, 35);

    return () => clearInterval(interval);
  }, [typingMessageId, messages]);

  // Lock body scroll when open (skip in pinned mode)
  useEffect(() => {
    if (!isOpen || isPinned) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen, isPinned]);

  // Pin/dock mode — push main content aside via data attribute
  useEffect(() => {
    if (isOpen && isPinned && isDesktop) {
      document.documentElement.dataset.aiPinned = "true";
      document.documentElement.style.setProperty("--ai-drawer-width", `${drawerWidth}px`);
    } else {
      delete document.documentElement.dataset.aiPinned;
      document.documentElement.style.removeProperty("--ai-drawer-width");
    }
    return () => {
      delete document.documentElement.dataset.aiPinned;
      document.documentElement.style.removeProperty("--ai-drawer-width");
    };
  }, [isOpen, isPinned, isDesktop, drawerWidth]);

  // Persist pin + width preferences
  useEffect(() => {
    localStorage.setItem(DRAWER_PINNED_KEY, isPinned ? "true" : "false");
  }, [isPinned]);
  useEffect(() => {
    localStorage.setItem(DRAWER_WIDTH_KEY, String(drawerWidth));
  }, [drawerWidth]);

  // Resize drawer to match visual viewport on mobile (keyboard open/close)
  useEffect(() => {
    if (!isOpen || isDesktop) return;
    const vv = window.visualViewport;
    if (!vv) return;

    const drawer = drawerRef.current;
    if (!drawer) return;

    const onResize = () => {
      const top = vv.offsetTop + safeHeaderOffsetPx;
      const height = Math.max(0, vv.height - safeHeaderOffsetPx);
      drawer.style.height = `${height}px`;
      drawer.style.top = `${top}px`;
      drawer.style.bottom = "auto";
    };

    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", onResize);
    onResize();

    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", onResize);
      if (drawer) {
        drawer.style.height = "";
        drawer.style.top = "";
        drawer.style.bottom = "";
      }
    };
  }, [isOpen, isDesktop, safeHeaderOffsetPx]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isSearchOpen) {
          setIsSearchOpen(false);
          setSearchQuery("");
        } else {
          onClose();
        }
        return;
      }
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key === "k") {
        e.preventDefault();
        textareaRef.current?.focus();
        return;
      }
      if (isMod && e.shiftKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        if (canAnalyze) void handleAnalyze();
        return;
      }
      if (isMod && e.key === "f") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
        queueMicrotask(() => searchInputRef.current?.focus());
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, isSearchOpen, onClose, canAnalyze]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !drawerRef.current) return;
    const frame = requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  // Auto-scroll to latest message
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior });
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior });
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
    if (!shouldFollowMessagesRef.current) return;

    setShowScrollToBottom(false);

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

  useEffect(() => {
    if (!isOpen || !typingMessageId) return;
    if (!shouldFollowMessagesRef.current) return;

    const frame = requestAnimationFrame(() => {
      scrollToBottom("instant");
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, typingMessageId, revealedLength, scrollToBottom]);

  useEffect(() => {
    if (!isOpen) return;
    shouldFollowMessagesRef.current = true;
  }, [isOpen]);

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

  const resizeTextarea = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, CHAT_INPUT_MAX_HEIGHT)}px`;
  }, []);

  const setInputWithResize = useCallback(
    (nextValue: string) => {
      setInput(nextValue);
      queueMicrotask(() => {
        if (!textareaRef.current) return;
        resizeTextarea(textareaRef.current);
      });
    },
    [resizeTextarea]
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (historyIndex !== null) {
      setHistoryIndex(null);
      setDraftBeforeHistoryNav("");
    }
    resizeTextarea(e.target);
  }, [historyIndex, resizeTextarea]);

  const runTask = useCallback(
    async (task: QueuedAiTask) => {
      if (!canUseAi) return;

      const controller = new AbortController();
      activeRequestAbortRef.current = controller;
      shouldFollowMessagesRef.current = true;
      setError(null);

      if (task.kind === "chat") {
        setIsSending(true);
        try {
          const result = await sendAiChat(
            {
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
              checkpointBossName: selectedCheckpoint?.name ?? null,
              checkpointStage: selectedCheckpoint?.stage ?? null,
              checkpointGymOrder: selectedCheckpoint?.gymOrder ?? null,
              checkpointCatchableNames:
                checkpointCatchables.catchableNames.length > 0
                  ? checkpointCatchables.catchableNames
                  : undefined,
              checkpointCatchablePoolSize:
                checkpointCatchables.catchablePoolSize > 0
                  ? checkpointCatchables.catchablePoolSize
                  : undefined,
              checkpointBlockedFinalNames:
                checkpointCatchables.blockedFinalNames.length > 0
                  ? checkpointCatchables.blockedFinalNames
                  : undefined,
              checkpointEvolutionFallbacks:
                checkpointCatchables.evolutionFallbacks.length > 0
                  ? checkpointCatchables.evolutionFallbacks
                  : undefined,
              message: task.message,
            },
            { signal: controller.signal }
          );

          onBindTeamId(result.teamId);
          if (result.usage) {
            setUsageSnapshot(result.usage);
          }
          setMessages((current) =>
            appendUniqueMessages(current, [result.userMessage, result.assistantMessage])
          );
          setRevealedLength(0);
          setTypingMessageId(result.assistantMessage.id);
        } catch (sendError: unknown) {
          if (isAbortError(sendError)) return;
          if (sendError instanceof ApiError && sendError.status === 429) {
            const quotaSnapshot =
              sendError.data && typeof sendError.data === "object"
                ? coerceUsageSnapshot((sendError.data as { usage?: unknown }).usage)
                : null;
            if (quotaSnapshot) {
              setUsageSnapshot(quotaSnapshot);
            }
          }
          const messageText = sendError instanceof Error ? sendError.message : "Could not send message.";
          if (messageText.toLowerCase().includes("team not found")) {
            onBindTeamId(null);
          }
          setError(messageText);
        } finally {
          setIsSending(false);
          if (activeRequestAbortRef.current === controller) {
            activeRequestAbortRef.current = null;
          }
        }
        return;
      }

      setIsAnalyzing(true);
      try {
        const result = await analyzeAiTeam(
          {
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
            checkpointBossName: selectedCheckpoint?.name ?? null,
            checkpointStage: selectedCheckpoint?.stage ?? null,
            checkpointGymOrder: selectedCheckpoint?.gymOrder ?? null,
            checkpointCatchableNames:
              checkpointCatchables.catchableNames.length > 0
                ? checkpointCatchables.catchableNames
                : undefined,
            checkpointCatchablePoolSize:
              checkpointCatchables.catchablePoolSize > 0
                ? checkpointCatchables.catchablePoolSize
                : undefined,
            checkpointBlockedFinalNames:
              checkpointCatchables.blockedFinalNames.length > 0
                ? checkpointCatchables.blockedFinalNames
                : undefined,
            checkpointEvolutionFallbacks:
              checkpointCatchables.evolutionFallbacks.length > 0
                ? checkpointCatchables.evolutionFallbacks
                : undefined,
          },
          { signal: controller.signal }
        );

        onBindTeamId(result.teamId);
        if (result.usage) {
          setUsageSnapshot(result.usage);
        }
        setMessages((current) =>
          appendUniqueMessages(current, [result.userMessage, result.assistantMessage])
        );
        setRevealedLength(0);
        setTypingMessageId(result.assistantMessage.id);
      } catch (analyzeError: unknown) {
        if (isAbortError(analyzeError)) return;
        if (analyzeError instanceof ApiError && analyzeError.status === 429) {
          const quotaSnapshot =
            analyzeError.data && typeof analyzeError.data === "object"
              ? coerceUsageSnapshot((analyzeError.data as { usage?: unknown }).usage)
              : null;
          if (quotaSnapshot) {
            setUsageSnapshot(quotaSnapshot);
          }
        }
        const messageText = analyzeError instanceof Error ? analyzeError.message : "Could not analyze team.";
        if (messageText.toLowerCase().includes("team not found")) {
          onBindTeamId(null);
        }
        setError(messageText);
      } finally {
        setIsAnalyzing(false);
        if (activeRequestAbortRef.current === controller) {
          activeRequestAbortRef.current = null;
        }
      }
    },
    [
      canUseAi,
      effectiveTeamId,
      generation,
      gameId,
      selectedVersionId,
      team,
      dexMode,
      versionFilterEnabled,
      typeFilter,
      regionalDexName,
      showAllowedPool,
      allowedPokemonNames,
      selectedCheckpoint,
      checkpointCatchables,
      onBindTeamId,
    ]
  );

  const queueTask = useCallback((task: QueueTaskInput) => {
    setQueuedTasks((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...task,
      },
    ]);
  }, []);

  const handleStopActiveTask = useCallback(() => {
    activeRequestAbortRef.current?.abort();
  }, []);

  function clearComposer() {
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function applySlashCommand(commandId: string) {
    setError(null);
    setInputWithResize(`/${commandId}`);
    setHistoryIndex(null);
    setDraftBeforeHistoryNav("");
    queueMicrotask(() => textareaRef.current?.focus());
  }

  async function executeSlashCommand(commandId: string): Promise<boolean> {
    const command = SLASH_COMMANDS.find((entry) => entry.id === commandId);
    if (!command) {
      setError(`Unknown command "/${commandId}". Type "/" to browse available commands.`);
      return false;
    }

    setError(null);
    if (command.task.kind === "analyze") {
      await handleAnalyze();
      return true;
    }

    await handleSend(command.task.message);
    return true;
  }

  async function handleSend(messageOverride?: string) {
    const message = (messageOverride ?? input).trim();
    if (!message || !canUseAi) return;
    emitHaptic("light");

    const slashMatch = message.match(/^\/([a-z-]+)\s*$/i);
    if (slashMatch) {
      const handled = await executeSlashCommand(slashMatch[1].toLowerCase());
      if (handled) clearComposer();
      return;
    }

    if (!canSendChat) {
      setError(
        `Chat quota reached for this month. Try Analyze if available. Resets ${formatResetDate(
          usageSnapshot?.resetsAt
        )}.`
      );
      return;
    }

    setHistoryIndex(null);
    setDraftBeforeHistoryNav("");

    if (isBusy) {
      queueTask({ kind: "chat", message });
      clearComposer();
      return;
    }

    clearComposer();
    await runTask({
      id: `${Date.now()}-chat`,
      kind: "chat",
      message,
    });
  }

  async function handleAnalyze() {
    if (!canAnalyze) return;

    if (isBusy) {
      queueTask({ kind: "analyze" });
      return;
    }

    await runTask({
      id: `${Date.now()}-analyze`,
      kind: "analyze",
    });
  }

  useEffect(() => {
    if (!canUseAi) {
      setQueuedTasks([]);
      setHistoryIndex(null);
      setDraftBeforeHistoryNav("");
    }
  }, [canUseAi]);

  useEffect(() => {
    if (historyIndex === null) return;
    if (userMessageHistory.length === 0) {
      setHistoryIndex(null);
      setDraftBeforeHistoryNav("");
      return;
    }
    if (historyIndex > userMessageHistory.length - 1) {
      setHistoryIndex(userMessageHistory.length - 1);
    }
  }, [historyIndex, userMessageHistory]);

  useEffect(() => {
    if (!isSlashMenuOpen) {
      setActiveSlashIndex(0);
      return;
    }
    setActiveSlashIndex((current) => {
      if (current < 0) return 0;
      if (current > filteredSlashCommands.length - 1) return filteredSlashCommands.length - 1;
      return current;
    });
  }, [filteredSlashCommands.length, isSlashMenuOpen]);

  useEffect(() => {
    if (!canUseAi || isBusy || queuedTasks.length === 0) return;
    const [nextTask, ...rest] = queuedTasks;
    setQueuedTasks(rest);
    void runTask(nextTask);
  }, [canUseAi, isBusy, queuedTasks, runTask]);

  useEffect(() => {
    return () => {
      activeRequestAbortRef.current?.abort();
    };
  }, []);

  const handleQuickCommand = (commandId: string) => {
    emitHaptic("light");
    void executeSlashCommand(commandId);
  };

  const handleCopyMessage = useCallback(async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      emitHaptic("light");
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId((prev) => (prev === messageId ? null : prev)), 1800);
    } catch {
      // Clipboard API may fail in some contexts
    }
  }, [emitHaptic]);

  const toggleCollapse = useCallback((messageId: string) => {
    setCollapsedMessages((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  }, []);

  // Swipe-to-dismiss handlers (mobile only)
  const handleSwipeTouchStart = useCallback((e: React.TouchEvent) => {
    if (isDesktop) return;
    swipeTouchStartY.current = e.touches[0].clientY;
    swipeTouchLastY.current = e.touches[0].clientY;
    swipeTouchLastTime.current = Date.now();
    swipeVelocity.current = 0;
  }, [isDesktop]);

  const handleSwipeTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDesktop || swipeTouchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - swipeTouchStartY.current;

    if (delta < 0) {
      setSwipeDragOffset(0);
      return;
    }

    const now = Date.now();
    const dt = now - swipeTouchLastTime.current;
    if (dt > 0 && swipeTouchLastY.current !== null) {
      swipeVelocity.current = (currentY - swipeTouchLastY.current) / dt;
    }
    swipeTouchLastY.current = currentY;
    swipeTouchLastTime.current = now;

    setSwipeDragOffset(delta);
  }, [isDesktop]);

  const handleSwipeTouchEnd = useCallback(() => {
    if (isDesktop) return;
    const velocity = swipeVelocity.current;
    const shouldClose = swipeDragOffset > 100 || velocity > 0.5;

    swipeTouchStartY.current = null;
    swipeTouchLastY.current = null;
    swipeVelocity.current = 0;
    setSwipeDragOffset(0);

    if (shouldClose) {
      emitHaptic("medium");
      onClose();
    }
  }, [emitHaptic, isDesktop, swipeDragOffset, onClose]);

  // Resize handle drag (desktop only)
  const handleResizePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isDesktop) return;
    e.preventDefault();
    resizeStartXRef.current = e.clientX;
    resizeStartWidthRef.current = drawerWidth;

    const onMove = (ev: PointerEvent) => {
      if (resizeStartXRef.current === null) return;
      const delta = resizeStartXRef.current - ev.clientX;
      const next = Math.min(DRAWER_MAX_WIDTH, Math.max(DRAWER_MIN_WIDTH, resizeStartWidthRef.current + delta));
      setDrawerWidth(next);
    };
    const onUp = () => {
      resizeStartXRef.current = null;
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }, [isDesktop, drawerWidth]);

  const handleMessageClick = useCallback((messageId: string, e: React.MouseEvent) => {
    if (!e.shiftKey) {
      setSelectedMessageIds(new Set());
      return;
    }
    e.preventDefault();
    setSelectedMessageIds((prev) => {
      const next = new Set(prev);
      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }
      return next;
    });
  }, []);

  const handleCopySelected = useCallback(async () => {
    if (selectedMessageIds.size === 0) return;
    const selected = messages.filter((m) => selectedMessageIds.has(m.id));
    const text = selected
      .map((m) => `${m.role === "assistant" ? "Coach" : "You"}: ${m.content}`)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      emitHaptic("light");
      setSelectedMessageIds(new Set());
    } catch {
      // Clipboard API may fail
    }
  }, [emitHaptic, messages, selectedMessageIds]);

  const handleExport = useCallback(() => {
    if (messages.length === 0) return;
    exportMessagesAsMarkdown(messages, generation, selectedVersionLabel);
    emitHaptic("success");
  }, [emitHaptic, messages, generation, selectedVersionLabel]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;

    if (isSlashMenuOpen && !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSlashIndex((current) => (current + 1) % filteredSlashCommands.length);
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSlashIndex((current) =>
          current <= 0 ? filteredSlashCommands.length - 1 : current - 1
        );
        return;
      }

      if (e.key === "Tab" || e.key === "Enter") {
        const selected = filteredSlashCommands[activeSlashIndex] ?? filteredSlashCommands[0];
        const isExactSingleMatch =
          e.key === "Enter" &&
          slashQuery !== null &&
          filteredSlashCommands.length === 1 &&
          selected?.id === slashQuery;
        if (isExactSingleMatch) {
          return;
        }

        e.preventDefault();
        if (selected) applySlashCommand(selected.id);
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setInputWithResize("");
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
      return;
    }

    if (
      (e.key === "ArrowUp" || e.key === "ArrowDown") &&
      !e.shiftKey &&
      !e.altKey &&
      !e.metaKey &&
      !e.ctrlKey
    ) {
      if (userMessageHistory.length === 0) return;

      const textarea = e.currentTarget;
      if (textarea.selectionStart !== textarea.selectionEnd) return;

      const value = textarea.value;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const cursorOnFirstLine = !value.slice(0, start).includes("\n");
      const cursorOnLastLine = !value.slice(end).includes("\n");

      if (e.key === "ArrowUp" && !cursorOnFirstLine) return;
      if (e.key === "ArrowDown" && !cursorOnLastLine) return;

      e.preventDefault();

      if (e.key === "ArrowUp") {
        const nextIndex =
          historyIndex === null ? userMessageHistory.length - 1 : Math.max(0, historyIndex - 1);
        if (historyIndex === null) {
          setDraftBeforeHistoryNav(input);
        }
        setHistoryIndex(nextIndex);
        setInputWithResize(userMessageHistory[nextIndex] ?? "");
        return;
      }

      if (historyIndex === null) return;
      const lastHistoryIndex = userMessageHistory.length - 1;
      if (historyIndex >= lastHistoryIndex) {
        setHistoryIndex(null);
        setInputWithResize(draftBeforeHistoryNav);
        setDraftBeforeHistoryNav("");
        return;
      }

      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setInputWithResize(userMessageHistory[nextIndex] ?? "");
    }
  };

  const handleMessagesScroll = useCallback(() => {
    if (typingMessageId) return;
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldFollowMessagesRef.current = distanceFromBottom <= 150;
    setShowScrollToBottom(distanceFromBottom > 200);
  }, [typingMessageId]);

  if (!shouldRender) return null;

  const animClass = isDesktop
    ? isAnimatingOut ? "ai-drawer-desktop-out" : "ai-drawer-desktop-in"
    : isAnimatingOut ? "ai-drawer-mobile-out" : "ai-drawer-mobile-in";

  const showGate = !isAuthenticated || !teamHasPokemon;
  const gateMessage = !isAuthenticated
    ? "Sign in to use AI Coach chat and team analysis."
    : "Add at least one Pokemon to your team before using AI Coach.";

  const displayMessages = isSearchOpen && searchQuery.trim() ? searchFilteredMessages : messages;

  return (
    <div
      className={`fixed inset-0 z-[100]${isPinned && isDesktop ? " pointer-events-none" : ""}`}
      role="dialog"
      aria-modal={!isPinned}
      aria-label="AI Coach"
    >
      {/* Backdrop — hidden when pinned */}
      {!(isPinned && isDesktop) && (
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
      )}

      {/* Drawer */}
      <section
        ref={drawerRef}
        tabIndex={-1}
        className={`ai-drawer ${animClass} pointer-events-auto fixed ${
          isDesktop ? "right-0 bottom-0" : "inset-0"
        }`}
        onAnimationEnd={onAnimationEnd}
        style={{
          top: `${safeHeaderOffsetPx}px`,
          ...(isDesktop ? { width: `${drawerWidth}px`, maxWidth: "none" } : {}),
          ...(swipeDragOffset > 0 ? {
            transform: `translateY(${swipeDragOffset}px)`,
            transition: "none",
            opacity: Math.max(0.4, 1 - swipeDragOffset / 300),
          } : {}),
        }}
      >
        {/* Desktop resize handle */}
        {isDesktop && (
          <div
            className="ai-resize-handle"
            onPointerDown={handleResizePointerDown}
          />
        )}

        {/* Mobile swipe handle */}
        {!isDesktop && (
          <div
            className="flex justify-center py-2"
            onTouchStart={handleSwipeTouchStart}
            onTouchMove={handleSwipeTouchMove}
            onTouchEnd={handleSwipeTouchEnd}
          >
            <div
              className="h-1 w-9 rounded-full"
              style={{ background: "var(--text-muted)", opacity: 0.35 }}
            />
          </div>
        )}

        {/* Header */}
        <div
          className="flex items-center justify-between gap-2 px-4 py-3 sm:px-5"
          style={{ borderBottom: "1px solid var(--border)" }}
          onTouchStart={handleSwipeTouchStart}
          onTouchMove={handleSwipeTouchMove}
          onTouchEnd={handleSwipeTouchEnd}
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

          <div className="flex items-center gap-1">
            {isDesktop && messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen((prev) => !prev);
                  queueMicrotask(() => searchInputRef.current?.focus());
                }}
                className="ai-header-btn"
                aria-label="Search messages"
                title="Search (⌘F)"
              >
                <FiSearch size={14} />
              </button>
            )}

            {isDesktop && messages.length > 0 && (
              <button
                type="button"
                onClick={handleExport}
                className="ai-header-btn"
                aria-label="Export chat as markdown"
                title="Export (.md)"
              >
                <FiDownload size={14} />
              </button>
            )}

            {isDesktop && (
              <button
                type="button"
                onClick={() => setIsPinned((prev) => !prev)}
                className={`ai-header-btn${isPinned ? " is-active" : ""}`}
                aria-label={isPinned ? "Unpin panel" : "Pin panel"}
                title={isPinned ? "Unpin (overlay)" : "Pin (dock)"}
              >
                <FiSidebar size={14} />
              </button>
            )}

            {isDesktop && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowShortcuts((prev) => !prev)}
                  onBlur={() => setTimeout(() => setShowShortcuts(false), 150)}
                  className="ai-header-btn"
                  aria-label="Keyboard shortcuts"
                  title="Shortcuts"
                >
                  <span className="text-[0.65rem] font-bold leading-none">?</span>
                </button>
                {showShortcuts && (
                  <div className="ai-shortcuts-tooltip">
                    <p><kbd>⌘K</kbd> Focus input</p>
                    <p><kbd>⌘⇧A</kbd> Analyze team</p>
                    <p><kbd>⌘F</kbd> Search messages</p>
                    <p><kbd>Esc</kbd> Close panel</p>
                    <p><kbd>Shift+Click</kbd> Multi-select</p>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="ai-header-btn"
              aria-label="Close"
            >
              <FiX size={15} />
            </button>
          </div>
        </div>

        {/* Search bar */}
        {isSearchOpen && (
          <div className="flex items-center gap-2 border-b px-4 py-2 sm:px-5" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
            <FiSearch size={13} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="ai-search-input"
            />
            {searchQuery && (
              <span className="text-[0.64rem] whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                {searchFilteredMessages.length}/{messages.length}
              </span>
            )}
            <button
              type="button"
              onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}
              className="ai-header-btn"
              aria-label="Close search"
            >
              <FiX size={13} />
            </button>
          </div>
        )}

        {/* Multi-select bar */}
        {selectedMessageIds.size > 0 && (
          <div
            className="flex items-center justify-between gap-2 border-b px-4 py-2 sm:px-5"
            style={{ borderColor: "var(--border)", background: "var(--version-color-soft, rgba(218,44,67,0.08))" }}
          >
            <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
              {selectedMessageIds.size} selected
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => void handleCopySelected()}
                className="ai-header-btn"
                aria-label="Copy selected messages"
              >
                <FiCopy size={13} />
                <span className="text-[0.64rem]">Copy</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedMessageIds(new Set())}
                className="ai-header-btn"
                aria-label="Clear selection"
              >
                <FiX size={13} />
              </button>
            </div>
          </div>
        )}

        {showGate ? (
          /* Gate: not authenticated or no team */
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
            {/* Messages area */}
            <AiMessageList
              displayMessages={displayMessages}
              messages={messages}
              pokemonNameLookup={pokemonNameLookup}
              typingMessageId={typingMessageId}
              revealedLength={revealedLength}
              collapsedMessages={collapsedMessages}
              toggleCollapse={toggleCollapse}
              onAutoCollapse={(id) => setCollapsedMessages((prev) => new Set(prev).add(id))}
              copiedMessageId={copiedMessageId}
              handleCopyMessage={handleCopyMessage}
              isSending={isSending}
              isAnalyzing={isAnalyzing}
              isLoadingHistory={isLoadingHistory}
              showScrollToBottom={showScrollToBottom}
              setShowScrollToBottom={setShowScrollToBottom}
              scrollToBottom={scrollToBottom}
              shouldFollowRef={shouldFollowMessagesRef}
              selectedMessageIds={selectedMessageIds}
              handleMessageClick={handleMessageClick}
              canSendChat={canSendChat}
              handleSend={handleSend}
              messagesEndRef={messagesEndRef}
              messagesContainerRef={messagesContainerRef}
              handleMessagesScroll={handleMessagesScroll}
            />

            {/* Error */}
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

            {/* Input area */}
            <div className="ai-drawer-input-area">
              {canUseAi && (
                <div className="mb-2 rounded-lg border px-2.5 py-1.5" style={{ borderColor: "var(--border)", background: "var(--surface-1)" }}>
                  <p className="text-[0.64rem]" style={{ color: "var(--text-muted)" }}>
                    {usageLoading
                      ? "Checking monthly AI limits..."
                      : usageSnapshot
                        ? `Chat: ${usageSnapshot.chat.used}/${usageSnapshot.chat.limit ?? "∞"} • Analyze: ${usageSnapshot.analyze.used}/${usageSnapshot.analyze.limit ?? "∞"} • Resets ${formatResetDate(usageSnapshot.resetsAt)}`
                        : "Monthly AI limits unavailable right now."}
                  </p>
                </div>
              )}
              {(isBusy || queuedTasks.length > 0) && (
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <p className="text-[0.68rem]" style={{ color: "var(--text-muted)" }}>
                    {isBusy ? "Coach is generating a reply" : "Coach is ready"}
                    {queuedTasks.length > 0 ? ` · ${queuedTasks.length} queued` : ""}
                  </p>
                  {isBusy && (
                    <button
                      type="button"
                      onClick={handleStopActiveTask}
                      className="ai-coach-stop-btn inline-flex items-center gap-1 rounded-md px-2 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.08em]"
                      style={{
                        border: "1px solid var(--border)",
                        background: "var(--surface-1)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <FiSquare size={10} aria-hidden="true" />
                      Stop
                    </button>
                  )}
                </div>
              )}

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
                  <FiZap size={13} style={{ color: canAnalyze ? "var(--version-color, var(--accent))" : "var(--text-muted)" }} />
                )}
                {isAnalyzing
                  ? "Analyzing..."
                  : isBusy
                    ? "Queue Analyze"
                    : "Analyze My Team"}
              </button>
              {!hasFullParty && (
                <p className="mb-2.5 text-center text-[0.68rem]" style={{ color: "var(--text-muted)" }}>
                  Add 6 party members to use Analyze My Team ({filledTeamSize}/6).
                </p>
              )}

              {/* Story Checkpoint */}
              <AiCheckpointSelector
                bossGuidanceLoading={bossGuidanceLoading}
                checkpointOptions={checkpointOptions}
                selectedCheckpoint={selectedCheckpoint}
                checkpointPendingLabel={checkpointPendingLabel}
                checkpointKeySelection={checkpointKeySelection}
                checkpointDropdownOpen={checkpointDropdownOpen}
                checkpointDropdownRef={checkpointDropdownRef}
                setCheckpointDropdownOpen={setCheckpointDropdownOpen}
                handleCheckpointSelection={handleCheckpointSelection}
                checkpointCatchables={checkpointCatchables}
              />

              {/* Quick command chips */}
              <div className="mb-2 flex flex-wrap gap-2 sm:gap-1.5">
                {quickCommandChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => handleQuickCommand(chip.id)}
                    disabled={chip.id === "analyze" ? !canAnalyze : !canSendChat}
                    className="ai-command-chip"
                    title={chip.description}
                    aria-label={chip.description}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Slash command menu */}
              {isSlashMenuOpen && (
                <div className="ai-slash-menu mb-2.5">
                  <div className="ai-slash-menu-head">
                    <p className="ai-slash-menu-title">Commands</p>
                    <div className="ai-slash-menu-keys" aria-hidden="true">
                      <kbd>↑</kbd>
                      <kbd>↓</kbd>
                      <kbd>Enter</kbd>
                    </div>
                  </div>
                  <div className="ai-slash-menu-list" role="listbox" aria-label="Available slash commands">
                    {filteredSlashCommands.map((command, index) => {
                      const isActive = index === activeSlashIndex;
                      return (
                        <button
                          key={command.id}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          className={`ai-slash-item${isActive ? " is-active" : ""}`}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => applySlashCommand(command.id)}
                        >
                          <span className="ai-slash-item-main">
                            <span className="ai-slash-item-command">/{command.id}</span>
                            <span className="ai-slash-item-description">{command.description}</span>
                          </span>
                          <span className="ai-slash-item-kind">
                            {command.task.kind === "analyze" ? "Action" : "Prompt"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
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
                  disabled={!canSendChat}
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={!canSendChat || !input.trim()}
                  className="ai-drawer-send-btn"
                  aria-label={isBusy ? "Queue message" : "Send message"}
                >
                  <FiArrowUp size={16} strokeWidth={2.5} />
                </button>
              </div>

              <p className="mt-2 text-center text-[0.62rem]" style={{ color: "var(--text-muted)" }}>
                {!canSendChat
                  ? `Chat quota reached. You can still use Analyze if available. Resets ${formatResetDate(
                      usageSnapshot?.resetsAt
                    )}.`
                  : isBusy
                  ? "Press Enter to queue your next prompt while Coach is working."
                  : "Suggestions follow your active filters and gen rules. Tap Send or type / for commands."}
              </p>
              <p className="mt-1 hidden text-center text-[0.6rem] sm:block" style={{ color: "var(--text-muted)", opacity: 0.85 }}>
                Use ↑/↓ for prompt history. While / menu is open, ↑/↓ + Enter selects a command.
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
