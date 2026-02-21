"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  FiArrowRight,
  FiArrowUp,
  FiCompass,
  FiLoader,
  FiMessageCircle,
  FiSquare,
  FiX,
  FiZap,
} from "react-icons/fi";
import { analyzeAiTeam, fetchAiMessages, sendAiChat, type AiMessage } from "@/lib/api";
import { useAnimatedUnmount } from "@/app/game/hooks/useAnimatedUnmount";
import { TYPE_COLORS } from "@/lib/constants";
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

type AssistantMessageBlock =
  | { type: "heading"; text: string }
  | { type: "unordered"; items: string[] }
  | { type: "ordered"; items: string[] }
  | { type: "paragraph"; text: string };
type AssistantMessageSection = {
  heading: string;
  blocks: Exclude<AssistantMessageBlock, { type: "heading" }>[];
};

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
  { id: "speed", description: "Audit speed control and tempo", task: { kind: "chat", message: "Evaluate this team’s speed control and tempo plan, then suggest one speed-focused upgrade." } },
  { id: "lead", description: "Recommend lead and pivot plan", task: { kind: "chat", message: "Recommend my best default lead and first pivot line for most matchups in this run." } },
];

const CHAT_INPUT_MAX_HEIGHT = 96;

const POKEMON_TYPE_SET = new Set([
  "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
  "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy",
]);
const BOSS_SECTION_HEADING_PATTERN = /(boss matchup|boss outlook|gym|elite four|champion)/i;

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

function isUnorderedListLine(line: string): boolean {
  return /^[-*•]\s+/.test(line);
}

function isOrderedListLine(line: string): boolean {
  return /^\d+[.)]\s+/.test(line);
}

function stripListMarker(line: string): string {
  return line.replace(/^[-*•]\s+/, "").replace(/^\d+[.)]\s+/, "").trim();
}

function cleanupMarkdownDecorators(text: string): string {
  return text
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/\s+#{1,6}\s*$/gm, "")
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g, "$1")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*\*([^*]+)\*\*\*/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*\n]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_\n]+)_/g, "$1")
    .replace(/~~([^~\n]+)~~/g, "$1")
    .replace(/^>\s?/gm, "")
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeLookupToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9'-]/g, "");
}

function splitCoachEntityLine(line: string): { name: string; detail: string } | null {
  const cleaned = line.trim();
  if (!cleaned) return null;

  const withParen = cleaned.match(/^([A-Z][A-Za-z0-9'.&/ -]{1,46})\s*\(([^)]+)\)\s*(?:[:\-–—]\s*)(.+)$/);
  if (withParen) {
    return {
      name: `${withParen[1].trim()} (${withParen[2].trim()})`,
      detail: withParen[3].trim(),
    };
  }

  const withSeparator = cleaned.match(/^([A-Z][A-Za-z0-9'.&/ -]{1,46})\s*(?:[:\-–—]\s*)(.+)$/);
  if (withSeparator) {
    return {
      name: withSeparator[1].trim(),
      detail: withSeparator[2].trim(),
    };
  }

  return null;
}

function renderStyledInlineText(
  text: string,
  pokemonNameLookup: Set<string>,
  keyPrefix: string
): ReactNode[] {
  const tokens = text.split(/(\s+|[()[\]{}.,!?;:]+)/g).filter((token) => token.length > 0);
  return tokens.map((token, tokenIndex) => {
    if (/^\s+$/.test(token) || /^[()[\]{}.,!?;:]+$/.test(token)) return token;

    const normalized = normalizeLookupToken(token);
    if (!normalized) return token;

    const strippedTypeSuffix = normalized.endsWith("type")
      ? normalized.replace(/-?type$/, "")
      : normalized;
    if (POKEMON_TYPE_SET.has(strippedTypeSuffix)) {
      const bgClass = TYPE_COLORS[strippedTypeSuffix] ?? "bg-stone-500";
      const displayName = strippedTypeSuffix.charAt(0).toUpperCase() + strippedTypeSuffix.slice(1);
      return (
        <span
          key={`${keyPrefix}-type-${tokenIndex}`}
          className={`mx-0.5 inline-flex items-center rounded px-1.5 py-px text-[0.65rem] font-semibold text-white ${bgClass}`}
          style={{ verticalAlign: "-0.05em", lineHeight: 1.4 }}
        >
          {displayName}
        </span>
      );
    }

    if (pokemonNameLookup.has(normalized)) {
      return (
        <span
          key={`${keyPrefix}-pokemon-${tokenIndex}`}
          className="ai-inline-token ai-inline-token-pokemon"
        >
          {token}
        </span>
      );
    }

    return token;
  });
}

function parseAssistantMessage(content: string): AssistantMessageBlock[] {
  const normalized = content.replace(/\r\n?/g, "\n").trim();
  if (!normalized) return [{ type: "paragraph", text: "" }];
  const blocks: AssistantMessageBlock[] = [];
  const lines = normalized.split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    const markdownHeading = line.match(/^#{1,6}\s*(.+)$/);
    if (markdownHeading) {
      const heading = cleanupMarkdownDecorators(markdownHeading[1]);
      if (heading) blocks.push({ type: "heading", text: heading });
      index += 1;
      continue;
    }

    const sectionHeading = line.match(/^([A-Za-z][^:]{1,64}):$/);
    if (sectionHeading) {
      const heading = cleanupMarkdownDecorators(sectionHeading[1]);
      if (heading) blocks.push({ type: "heading", text: heading });
      index += 1;
      continue;
    }

    if (isUnorderedListLine(line)) {
      const items: string[] = [];
      while (index < lines.length && isUnorderedListLine(lines[index].trim())) {
        items.push(cleanupMarkdownDecorators(stripListMarker(lines[index].trim())));
        index += 1;
      }
      if (items.length > 0) blocks.push({ type: "unordered", items });
      continue;
    }

    if (isOrderedListLine(line)) {
      const items: string[] = [];
      while (index < lines.length && isOrderedListLine(lines[index].trim())) {
        items.push(cleanupMarkdownDecorators(stripListMarker(lines[index].trim())));
        index += 1;
      }
      if (items.length > 0) blocks.push({ type: "ordered", items });
      continue;
    }

    const paragraphLines: string[] = [line];
    index += 1;
    while (index < lines.length) {
      const candidate = lines[index].trim();
      if (!candidate) break;
      if (
        /^#{1,6}\s*/.test(candidate) ||
        /^([A-Za-z][^:]{1,64}):$/.test(candidate) ||
        isUnorderedListLine(candidate) ||
        isOrderedListLine(candidate)
      ) {
        break;
      }
      paragraphLines.push(candidate);
      index += 1;
    }
    blocks.push({
      type: "paragraph",
      text: cleanupMarkdownDecorators(paragraphLines.join("\n")),
    });
  }

  return blocks.length > 0 ? blocks : [{ type: "paragraph", text: cleanupMarkdownDecorators(normalized) }];
}

function groupAssistantBlocks(blocks: AssistantMessageBlock[]): AssistantMessageSection[] {
  const sections: AssistantMessageSection[] = [];
  let currentSection: AssistantMessageSection | null = null;

  for (const block of blocks) {
    if (block.type === "heading") {
      const nextSection: AssistantMessageSection = {
        heading: block.text,
        blocks: [],
      };
      sections.push(nextSection);
      currentSection = nextSection;
      continue;
    }

    if (!currentSection) {
      currentSection = {
        heading: "Overview",
        blocks: [],
      };
      sections.push(currentSection);
    }
    currentSection.blocks.push(block);
  }

  return sections.filter((section) => section.blocks.length > 0);
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === "AbortError") ||
    (error instanceof Error && error.name === "AbortError")
  );
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
  const [queuedTasks, setQueuedTasks] = useState<QueuedAiTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [revealedLength, setRevealedLength] = useState(0);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const [draftBeforeHistoryNav, setDraftBeforeHistoryNav] = useState("");
  const [activeSlashIndex, setActiveSlashIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useRef(false);
  const shouldFollowMessagesRef = useRef(true);
  const activeRequestAbortRef = useRef<AbortController | null>(null);

  const effectiveTeamId = useMemo(() => boundTeamId ?? activeTeamId, [activeTeamId, boundTeamId]);
  const canUseAi = isAuthenticated && teamHasPokemon;
  const isBusy = isSending || isAnalyzing;
  const filledTeamSize = useMemo(() => team.filter(Boolean).length, [team]);
  const hasFullParty = filledTeamSize === 6;
  const canAnalyze = canUseAi && hasFullParty;
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

  const quickPrompts = useMemo(
    () => [
      { label: "Swap ideas", text: "Give me 2 legal swap ideas based on my current filters." },
      { label: "Boss strategy", text: "What is my safest gameplan for the next major boss fight?" },
      { label: "Fix weakness", text: "Where is this team weakest and what is one fix?" },
    ],
    []
  );
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
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
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
      scrollToBottom("auto");
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

  // Auto-resize textarea
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
              message: task.message,
            },
            { signal: controller.signal }
          );

          onBindTeamId(result.teamId);
          setMessages((current) =>
            appendUniqueMessages(current, [result.userMessage, result.assistantMessage])
          );
          setRevealedLength(0);
          setTypingMessageId(result.assistantMessage.id);
        } catch (sendError: unknown) {
          if (isAbortError(sendError)) return;
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
          },
          { signal: controller.signal }
        );

        onBindTeamId(result.teamId);
        setMessages((current) =>
          appendUniqueMessages(current, [result.userMessage, result.assistantMessage])
        );
        setRevealedLength(0);
        setTypingMessageId(result.assistantMessage.id);
      } catch (analyzeError: unknown) {
        if (isAbortError(analyzeError)) return;
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

    const slashMatch = message.match(/^\/([a-z-]+)\s*$/i);
    if (slashMatch) {
      const handled = await executeSlashCommand(slashMatch[1].toLowerCase());
      if (handled) clearComposer();
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
    void executeSlashCommand(commandId);
  };

  const renderAssistantBlock = useCallback(
    (
      messageId: string,
      block: Exclude<AssistantMessageBlock, { type: "heading" }>,
      blockIndex: number,
      sectionHeading?: string
    ) => {
      const shouldFormatCoachEntities =
        typeof sectionHeading === "string" &&
        BOSS_SECTION_HEADING_PATTERN.test(sectionHeading);

      if (block.type === "unordered") {
        return (
          <ul key={`${messageId}-ul-${blockIndex}`}>
            {block.items.map((item, itemIndex) => {
              const entityLine = shouldFormatCoachEntities ? splitCoachEntityLine(item) : null;
              if (entityLine) {
                return (
                  <li key={`${messageId}-ul-item-${blockIndex}-${itemIndex}`} className="ai-coach-entity-row">
                    <span className="ai-coach-entity-name">
                      {renderStyledInlineText(
                        entityLine.name,
                        pokemonNameLookup,
                        `${messageId}-ul-entity-name-${blockIndex}-${itemIndex}`
                      )}
                    </span>
                    <span className="ai-coach-entity-detail">
                      {renderStyledInlineText(
                        entityLine.detail,
                        pokemonNameLookup,
                        `${messageId}-ul-entity-detail-${blockIndex}-${itemIndex}`
                      )}
                    </span>
                  </li>
                );
              }

              return (
                <li key={`${messageId}-ul-item-${blockIndex}-${itemIndex}`}>
                  {renderStyledInlineText(
                    item,
                    pokemonNameLookup,
                    `${messageId}-ul-item-${blockIndex}-${itemIndex}`
                  )}
                </li>
              );
            })}
          </ul>
        );
      }
      if (block.type === "ordered") {
        return (
          <ol key={`${messageId}-ol-${blockIndex}`}>
            {block.items.map((item, itemIndex) => {
              const entityLine = shouldFormatCoachEntities ? splitCoachEntityLine(item) : null;
              if (entityLine) {
                return (
                  <li key={`${messageId}-ol-item-${blockIndex}-${itemIndex}`} className="ai-coach-entity-row">
                    <span className="ai-coach-entity-name">
                      {renderStyledInlineText(
                        entityLine.name,
                        pokemonNameLookup,
                        `${messageId}-ol-entity-name-${blockIndex}-${itemIndex}`
                      )}
                    </span>
                    <span className="ai-coach-entity-detail">
                      {renderStyledInlineText(
                        entityLine.detail,
                        pokemonNameLookup,
                        `${messageId}-ol-entity-detail-${blockIndex}-${itemIndex}`
                      )}
                    </span>
                  </li>
                );
              }

              return (
                <li key={`${messageId}-ol-item-${blockIndex}-${itemIndex}`}>
                  {renderStyledInlineText(
                    item,
                    pokemonNameLookup,
                    `${messageId}-ol-item-${blockIndex}-${itemIndex}`
                  )}
                </li>
              );
            })}
          </ol>
        );
      }

      return (
        <p key={`${messageId}-p-${blockIndex}`} className="whitespace-pre-wrap">
          {renderStyledInlineText(block.text, pokemonNameLookup, `${messageId}-p-${blockIndex}`)}
        </p>
      );
    },
    [pokemonNameLookup]
  );

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
    const container = messagesContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldFollowMessagesRef.current = distanceFromBottom <= 72;
  }, []);

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
            <div
              ref={messagesContainerRef}
              className="ai-drawer-messages min-h-0 px-4 py-4 sm:px-5"
              onScroll={handleMessagesScroll}
            >
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <FiLoader size={18} className="animate-spin" style={{ color: "var(--text-muted)" }} />
                  <span className="ml-2 text-sm" style={{ color: "var(--text-muted)" }}>
                    Loading history...
                  </span>
                </div>
              ) : messages.length === 0 && !isBusy ? (
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
                        disabled={!canUseAi}
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
                    const assistantBlocks = isAssistant ? parseAssistantMessage(displayContent) : [];
                    const hasSectionHeadings = assistantBlocks.some((block) => block.type === "heading");
                    const assistantSections = hasSectionHeadings
                      ? groupAssistantBlocks(assistantBlocks)
                      : [];

                    return (
                      <div
                        key={message.id}
                        className={`ai-message-enter flex ${isAssistant ? "justify-start" : "justify-end"}`}
                      >
                        <article
                          className={`ai-message-bubble rounded-2xl ${
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
                              style={{ color: "var(--version-color, var(--accent))" }}
                            >
                              <FiMessageCircle size={9} />
                              Coach
                            </p>
                          )}
                          {isAssistant ? (
                            <div className={`ai-message-content${isTyping ? " ai-typing-cursor" : ""}`}>
                              {hasSectionHeadings
                                ? assistantSections.map((section, sectionIndex) => (
                                    <details
                                      key={`${message.id}-section-${sectionIndex}`}
                                      className="ai-message-section"
                                      open
                                    >
                                      <summary>
                                        {renderStyledInlineText(
                                          section.heading,
                                          pokemonNameLookup,
                                          `${message.id}-section-heading-${sectionIndex}`
                                        )}
                                      </summary>
                                      <div className="ai-message-section-body">
                                        {section.blocks.map((sectionBlock, blockIndex) =>
                                          renderAssistantBlock(
                                            `${message.id}-section-${sectionIndex}`,
                                            sectionBlock,
                                            blockIndex,
                                            section.heading
                                          )
                                        )}
                                      </div>
                                    </details>
                                  ))
                                : assistantBlocks.map((block, blockIndex) => {
                                    if (block.type === "heading") return null;
                                    return renderAssistantBlock(message.id, block, blockIndex, undefined);
                                  })}
                            </div>
                          ) : (
                            <p className={`whitespace-pre-wrap${isTyping ? " ai-typing-cursor" : ""}`}>
                              {displayContent}
                            </p>
                          )}
                        </article>
                      </div>
                    );
                  })}

                  {/* Thinking indicator */}
                  {(isSending || isAnalyzing) && (
                    <div className="ai-message-enter flex justify-start">
                      <div
                        className="ai-message-bubble flex items-center gap-2.5 rounded-2xl rounded-tl-md"
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

              <div className="mb-2 flex flex-wrap gap-1.5">
                {quickCommandChips.map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => handleQuickCommand(chip.id)}
                    disabled={!canUseAi}
                    className="ai-command-chip"
                    title={chip.description}
                    aria-label={chip.description}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {isSlashMenuOpen && (
                <div className="ai-slash-menu mb-2.5" role="listbox" aria-label="Available slash commands">
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
                        <span className="ai-slash-item-command">/{command.id}</span>
                        <span className="ai-slash-item-description">{command.description}</span>
                      </button>
                    );
                  })}
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
                  disabled={!canUseAi}
                />
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={!canUseAi || !input.trim()}
                  className="ai-drawer-send-btn"
                  aria-label={isBusy ? "Queue message" : "Send message"}
                >
                  <FiArrowUp size={16} strokeWidth={2.5} />
                </button>
              </div>

              <p className="mt-2 text-center text-[0.62rem]" style={{ color: "var(--text-muted)" }}>
                {isBusy
                  ? "Press Enter to queue your next prompt while Coach is working."
                  : "Suggestions follow your active filters and gen rules. Press Enter to send, or type / for commands."}
              </p>
              <p className="mt-1 text-center text-[0.6rem]" style={{ color: "var(--text-muted)", opacity: 0.85 }}>
                Use ↑/↓ for prompt history. While / menu is open, ↑/↓ + Enter selects a command.
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
