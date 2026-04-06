"use client";

import { FiArrowRight, FiCheck, FiChevronDown, FiCopy, FiLoader, FiMessageCircle, FiZap } from "react-icons/fi";
import type { AiMessage } from "@/lib/api";
import {
  BOSS_SECTION_HEADING_PATTERN,
  parseAssistantMessage,
  groupAssistantBlocks,
  renderStyledInlineText,
  splitCoachEntityLine,
  relativeTime,
  type AssistantMessageBlock,
} from "./aiMessageParser";

const COLLAPSE_HEIGHT_PX = 300;

const QUICK_PROMPTS = [
  { label: "Swap ideas", text: "Give me 2 legal swap ideas based on my current filters." },
  { label: "Boss strategy", text: "What is my safest gameplan for the next major boss fight?" },
  { label: "Fix weakness", text: "Where is this team weakest and what is one fix?" },
] as const;

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

interface AiMessageListProps {
  hideContent: boolean;
  displayMessages: AiMessage[];
  messages: AiMessage[];
  pokemonNameLookup: Set<string>;
  typingMessageId: string | null;
  revealedLength: number;
  collapsedMessages: Set<string>;
  toggleCollapse: (id: string) => void;
  onAutoCollapse: (id: string) => void;
  copiedMessageId: string | null;
  handleCopyMessage: (id: string, content: string) => Promise<void>;
  isSending: boolean;
  isAnalyzing: boolean;
  isLoadingHistory: boolean;
  showScrollToBottom: boolean;
  setShowScrollToBottom: (v: boolean) => void;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  shouldFollowRef: React.MutableRefObject<boolean>;
  selectedMessageIds: Set<string>;
  handleMessageClick: (id: string, e: React.MouseEvent) => void;
  canSendChat: boolean;
  handleSend: (messageOverride?: string) => Promise<void>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  handleMessagesScroll: () => void;
}

export default function AiMessageList({
  hideContent,
  displayMessages,
  messages,
  pokemonNameLookup,
  typingMessageId,
  revealedLength,
  collapsedMessages,
  toggleCollapse,
  onAutoCollapse,
  copiedMessageId,
  handleCopyMessage,
  isSending,
  isAnalyzing,
  isLoadingHistory,
  showScrollToBottom,
  setShowScrollToBottom,
  scrollToBottom,
  shouldFollowRef,
  selectedMessageIds,
  handleMessageClick,
  canSendChat,
  handleSend,
  messagesEndRef,
  messagesContainerRef,
  handleMessagesScroll,
}: AiMessageListProps) {
  const isBusy = isSending || isAnalyzing;

  function renderAssistantBlock(
    messageId: string,
    block: Exclude<AssistantMessageBlock, { type: "heading" }>,
    blockIndex: number,
    sectionHeading?: string
  ) {
    const shouldFormatCoachEntities =
      typeof sectionHeading === "string" && BOSS_SECTION_HEADING_PATTERN.test(sectionHeading);

    if (block.type === "unordered") {
      return (
        <ul key={`${messageId}-ul-${blockIndex}`}>
          {block.items.map((item, itemIndex) => {
            const entityLine = shouldFormatCoachEntities ? splitCoachEntityLine(item) : null;
            if (entityLine) {
              return (
                <li key={`${messageId}-ul-item-${blockIndex}-${itemIndex}`} className="ai-coach-entity-row">
                  <span className="ai-coach-entity-name">
                    {renderStyledInlineText(entityLine.name, pokemonNameLookup, `${messageId}-ul-entity-name-${blockIndex}-${itemIndex}`)}
                  </span>
                  <span className="ai-coach-entity-detail">
                    {renderStyledInlineText(entityLine.detail, pokemonNameLookup, `${messageId}-ul-entity-detail-${blockIndex}-${itemIndex}`)}
                  </span>
                </li>
              );
            }
            return (
              <li key={`${messageId}-ul-item-${blockIndex}-${itemIndex}`}>
                {renderStyledInlineText(item, pokemonNameLookup, `${messageId}-ul-item-${blockIndex}-${itemIndex}`)}
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
                    {renderStyledInlineText(entityLine.name, pokemonNameLookup, `${messageId}-ol-entity-name-${blockIndex}-${itemIndex}`)}
                  </span>
                  <span className="ai-coach-entity-detail">
                    {renderStyledInlineText(entityLine.detail, pokemonNameLookup, `${messageId}-ol-entity-detail-${blockIndex}-${itemIndex}`)}
                  </span>
                </li>
              );
            }
            return (
              <li key={`${messageId}-ol-item-${blockIndex}-${itemIndex}`}>
                {renderStyledInlineText(item, pokemonNameLookup, `${messageId}-ol-item-${blockIndex}-${itemIndex}`)}
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
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={messagesContainerRef}
        className="ai-drawer-messages min-h-0 px-4 py-4 sm:px-5"
        onScroll={handleMessagesScroll}
        style={hideContent ? { visibility: "hidden" } : undefined}
      >
        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-12">
            <FiLoader size={18} className="animate-spin" style={{ color: "var(--text-muted)" }} />
            <span className="ml-2 text-sm" style={{ color: "var(--text-muted)" }}>
              Loading history...
            </span>
          </div>
        ) : messages.length === 0 && !isBusy ? (
          /* ── Empty state ── */
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
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => void handleSend(prompt.text)}
                  disabled={!canSendChat}
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
            {(() => {
              const lastAssistantId = [...displayMessages].reverse().find((m) => m.role === "assistant")?.id;
              return displayMessages.map((message) => {
                const isAssistant = message.role === "assistant";
                const isTyping = message.id === typingMessageId;
                const isLatestAssistant = message.id === lastAssistantId;
                const displayContent = isTyping ? message.content.slice(0, revealedLength) : message.content;
                const assistantBlocks = isAssistant ? parseAssistantMessage(displayContent) : [];
                const hasSectionHeadings = assistantBlocks.some((block) => block.type === "heading");
                const assistantSections = hasSectionHeadings ? groupAssistantBlocks(assistantBlocks) : [];
                const isSelected = selectedMessageIds.has(message.id);

                return (
                  <div
                    key={message.id}
                    className={`ai-message-enter flex ${isAssistant ? "justify-start" : "justify-end"}`}
                    onClick={(e) => handleMessageClick(message.id, e)}
                  >
                    <article
                      className={`ai-message-bubble group relative rounded-2xl ${
                        isAssistant ? "rounded-tl-md" : "rounded-tr-md"
                      }${isSelected ? " ai-message-selected" : ""}`}
                      style={{
                        background: isSelected
                          ? "var(--version-color-soft, rgba(218,44,67,0.18))"
                          : isAssistant ? "var(--surface-2)" : "var(--version-color-soft, rgba(218,44,67,0.12))",
                        border: `1px solid ${
                          isSelected
                            ? "var(--version-color, var(--accent))"
                            : isAssistant
                              ? "var(--border)"
                              : "var(--version-color-border, rgba(218,44,67,0.22))"
                        }`,
                        color: "var(--text-primary)",
                      }}
                    >
                      {isAssistant && (
                        <div className="mb-1 flex items-center justify-between">
                          <p
                            className="flex items-center gap-1 text-[0.62rem] font-semibold uppercase tracking-[0.08em]"
                            style={{ color: "var(--version-color, var(--accent))" }}
                          >
                            <FiMessageCircle size={9} />
                            Coach
                          </p>
                          {!isTyping && (
                            <button
                              type="button"
                              onClick={() => void handleCopyMessage(message.id, message.content)}
                              className="ai-copy-btn"
                              aria-label={copiedMessageId === message.id ? "Copied" : "Copy message"}
                            >
                              {copiedMessageId === message.id
                                ? <FiCheck size={11} strokeWidth={3} />
                                : <FiCopy size={11} />}
                            </button>
                          )}
                        </div>
                      )}

                      {isAssistant ? (
                        <div
                          className={`ai-message-content${isTyping ? " ai-typing-cursor" : ""}${
                            !isTyping && collapsedMessages.has(message.id) ? " ai-message-collapsed" : ""
                          }`}
                          ref={(el) => {
                            if (!el || isTyping || isLatestAssistant) return;
                            if (el.scrollHeight > COLLAPSE_HEIGHT_PX && !collapsedMessages.has(message.id)) {
                              if (!el.dataset.measured) {
                                el.dataset.measured = "1";
                                onAutoCollapse(message.id);
                              }
                            }
                          }}
                        >
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

                      {isAssistant && !isTyping && collapsedMessages.has(message.id) && (
                        <button type="button" onClick={() => toggleCollapse(message.id)} className="ai-show-more-btn">
                          Show more
                        </button>
                      )}
                      {isAssistant && !isTyping && !collapsedMessages.has(message.id) && message.content.length > 600 && (
                        <button type="button" onClick={() => toggleCollapse(message.id)} className="ai-show-more-btn">
                          Show less
                        </button>
                      )}
                    </article>

                    {!isTyping && message.createdAt && (
                      <time
                        dateTime={message.createdAt}
                        className="mt-0.5 block text-[0.58rem]"
                        style={{ color: "var(--text-muted)", opacity: 0.7 }}
                      >
                        {relativeTime(message.createdAt)}
                      </time>
                    )}
                  </div>
                );
              });
            })()}

            {/* Thinking indicator */}
            {isBusy && (
              <div className="ai-message-enter flex justify-start">
                <div
                  className="ai-message-bubble flex items-center gap-2.5 rounded-2xl rounded-tl-md"
                  style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
                >
                  <PokeballIcon size={16} className="ai-thinking-pokeball" />
                  <span className="text-[0.78rem] font-medium" style={{ color: "var(--text-muted)" }}>
                    Coach is thinking
                  </span>
                  <span className="ai-thinking-dots flex items-center gap-[3px]">
                    <span /><span /><span />
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Scroll-to-bottom FAB */}
      {showScrollToBottom && messages.length > 0 && (
        <button
          type="button"
          onClick={() => {
            shouldFollowRef.current = true;
            setShowScrollToBottom(false);
            scrollToBottom("smooth");
          }}
          className="ai-scroll-fab"
          aria-label="Scroll to latest message"
        >
          <FiChevronDown size={18} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
