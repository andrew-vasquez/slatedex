"use client";

import { FiChevronDown } from "react-icons/fi";
import { AUTO_CHECKPOINT_KEY, type CheckpointOption, type UseAiCheckpointReturn } from "./useAiCheckpoint";
import { checkpointLabel } from "./aiMessageParser";
import type { CheckpointLegality } from "./aiMessageParser";

interface AiCheckpointSelectorProps {
  bossGuidanceLoading: boolean;
  checkpointOptions: CheckpointOption[];
  selectedCheckpoint: UseAiCheckpointReturn["selectedCheckpoint"];
  checkpointPendingLabel: string | null;
  checkpointKeySelection: string;
  checkpointDropdownOpen: boolean;
  checkpointDropdownRef: React.RefObject<HTMLDivElement | null>;
  setCheckpointDropdownOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleCheckpointSelection: (nextKey: string) => Promise<void>;
  checkpointCatchables: CheckpointLegality;
}

export default function AiCheckpointSelector({
  bossGuidanceLoading,
  checkpointOptions,
  selectedCheckpoint,
  checkpointPendingLabel,
  checkpointKeySelection,
  checkpointDropdownOpen,
  checkpointDropdownRef,
  setCheckpointDropdownOpen,
  handleCheckpointSelection,
  checkpointCatchables,
}: AiCheckpointSelectorProps) {
  const isAutoSelected = checkpointKeySelection === AUTO_CHECKPOINT_KEY;

  return (
    <div
      className="mb-2.5 rounded-xl px-2.5 py-2"
      style={{
        border: "1px solid var(--border)",
        background: "var(--surface-2)",
        overflow: "visible",
        position: "relative",
      }}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p
          className="text-[0.66rem] font-semibold uppercase tracking-[0.08em]"
          style={{ color: "var(--text-muted)" }}
        >
          Story Checkpoint
        </p>
        {bossGuidanceLoading && (
          <span className="text-[0.62rem]" style={{ color: "var(--text-muted)" }}>
            Loading...
          </span>
        )}
      </div>

      {/* ── Mobile: scrollable pill row ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 sm:hidden">
        <button
          type="button"
          onClick={() => void handleCheckpointSelection(AUTO_CHECKPOINT_KEY)}
          className="shrink-0 rounded-full border px-2.5 py-1 text-[0.66rem] font-semibold transition-colors"
          style={{
            borderColor:
              isAutoSelected && !checkpointPendingLabel
                ? "var(--version-color-border, rgba(218,44,67,0.35))"
                : "var(--border)",
            background:
              isAutoSelected && !checkpointPendingLabel
                ? "var(--version-color-soft, rgba(218,44,67,0.12))"
                : "var(--surface-1)",
            color:
              isAutoSelected && !checkpointPendingLabel
                ? "var(--version-color, var(--accent))"
                : "var(--text-secondary)",
          }}
        >
          Auto
        </button>

        {checkpointPendingLabel ? (
          <button
            type="button"
            disabled
            className="shrink-0 rounded-full border px-2.5 py-1 text-[0.66rem] font-semibold"
            style={{
              borderColor: "var(--version-color-border, rgba(218,44,67,0.35))",
              background: "var(--version-color-soft, rgba(218,44,67,0.12))",
              color: "var(--version-color, var(--accent))",
              opacity: 0.7,
              cursor: "default",
            }}
          >
            {checkpointPendingLabel}
          </button>
        ) : null}

        {checkpointOptions.map((option) => {
          const isSelected = checkpointKeySelection === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => void handleCheckpointSelection(option.key)}
              className="shrink-0 rounded-full border px-2.5 py-1 text-[0.66rem] font-semibold transition-colors"
              title={option.label}
              style={{
                borderColor: isSelected
                  ? "var(--version-color-border, rgba(218,44,67,0.35))"
                  : "var(--border)",
                background: isSelected
                  ? "var(--version-color-soft, rgba(218,44,67,0.12))"
                  : "var(--surface-1)",
                color: isSelected
                  ? "var(--version-color, var(--accent))"
                  : "var(--text-secondary)",
              }}
            >
              {option.entry.stage === "gym"
                ? `G${option.entry.gymOrder ?? "?"} ${option.entry.name}`
                : option.entry.stage === "elite4"
                  ? `E4 ${option.entry.name}`
                  : `Champ ${option.entry.name}`}
            </button>
          );
        })}
      </div>

      {/* ── Desktop: custom dropdown ── */}
      <div className="hidden sm:block" style={{ position: "relative" }} ref={checkpointDropdownRef}>
        <button
          type="button"
          onClick={() => setCheckpointDropdownOpen((prev) => !prev)}
          className="ai-checkpoint-trigger"
        >
          <span
            key={checkpointPendingLabel ?? checkpointKeySelection}
            className="truncate"
            style={{ animation: "checkpointLabelIn 0.18s ease" }}
          >
            {checkpointPendingLabel ??
              (isAutoSelected
                ? "Auto"
                : (() => {
                    const match = checkpointOptions.find((o) => o.key === checkpointKeySelection);
                    return match ? checkpointLabel(match.entry) : "Auto";
                  })())}
          </span>
          <FiChevronDown
            size={13}
            className={`shrink-0 transition-transform duration-150${checkpointDropdownOpen ? "" : " rotate-180"}`}
          />
        </button>

        {checkpointDropdownOpen && (
          <div className="ai-checkpoint-menu">
            <button
              type="button"
              onClick={() => {
                void handleCheckpointSelection(AUTO_CHECKPOINT_KEY);
                setCheckpointDropdownOpen(false);
              }}
              className={`ai-checkpoint-item${isAutoSelected ? " is-selected" : ""}`}
            >
              <span className="font-semibold">Auto</span>
              <span className="ai-checkpoint-item-sub">Uses boss names from your prompt</span>
            </button>

            {checkpointOptions.map((option) => {
              const isSelected = checkpointKeySelection === option.key;
              const stageTag =
                option.entry.stage === "gym"
                  ? `G${option.entry.gymOrder ?? "?"}`
                  : option.entry.stage === "elite4"
                    ? "E4"
                    : "CH";
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    void handleCheckpointSelection(option.key);
                    setCheckpointDropdownOpen(false);
                  }}
                  className={`ai-checkpoint-item${isSelected ? " is-selected" : ""}`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="ai-checkpoint-tag">{stageTag}</span>
                    <span className="font-semibold">{option.entry.name}</span>
                  </span>
                  {option.entry.recommendedPlayerLevelRange && (
                    <span className="ai-checkpoint-item-sub">
                      {option.entry.recommendedPlayerLevelRange}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-1.5 text-[0.62rem]" style={{ color: "var(--text-muted)" }}>
        {selectedCheckpoint
          ? checkpointCatchables.catchablePoolSize > 0
            ? `Checkpoint pool: ~${checkpointCatchables.catchablePoolSize} legal species, ${checkpointCatchables.evolutionFallbacks.length} evolution fallback rules applied.`
            : "Checkpoint selected. Catch pool sample unavailable, so the coach will keep encounter timing conservative."
          : "Auto mode uses boss names or gym numbering from your prompt."}
      </p>
    </div>
  );
}
