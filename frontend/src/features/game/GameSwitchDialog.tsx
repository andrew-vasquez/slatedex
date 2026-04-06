"use client";

import { useEffect } from "react";
import { FiRepeat } from "react-icons/fi";

interface GameSwitchDialogProps {
  isOpen: boolean;
  targetGameName: string;
  onKeepTeam: () => void;
  onStartFresh: () => void;
  onCancel: () => void;
}

const GameSwitchDialog = ({ isOpen, targetGameName, onKeepTeam, onStartFresh, onCancel }: GameSwitchDialogProps) => {
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="game-switch-title">
      <button
        type="button"
        onClick={onCancel}
        className="absolute inset-0 bg-[rgba(20,16,12,0.45)] backdrop-blur-[2px]"
        aria-label="Close dialog"
      />

      <div className="panel relative w-full max-w-md p-5 animate-fade-in-up">
        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ background: "var(--accent-blue-soft)", border: "1px solid rgba(59, 130, 246, 0.24)", color: "var(--accent-blue)" }}
          >
            <FiRepeat size={16} aria-hidden="true" />
          </div>

          <div>
            <h3 id="game-switch-title" className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
              Keep current team?
            </h3>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              You have Pokemon in your team. Carry them into <strong>{targetGameName}</strong>, or start fresh?
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={onStartFresh} className="btn-secondary">
            Start Fresh
          </button>
          <button
            type="button"
            onClick={onKeepTeam}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold"
            style={{
              background: "var(--accent-blue)",
              color: "#fff",
              border: "1px solid rgba(59, 130, 246, 0.5)",
              transition: "transform 0.2s ease, filter 0.2s ease",
            }}
          >
            Keep Team
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameSwitchDialog;
