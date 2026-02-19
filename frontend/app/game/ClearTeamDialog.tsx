"use client";

import { useEffect } from "react";
import { FiAlertTriangle } from "react-icons/fi";

interface ClearTeamDialogProps {
  isOpen: boolean;
  teamCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

const ClearTeamDialog = ({ isOpen, teamCount, onCancel, onConfirm }: ClearTeamDialogProps) => {
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
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="clear-team-title">
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
            style={{ background: "rgba(218, 44, 67, 0.14)", border: "1px solid rgba(218, 44, 67, 0.24)", color: "var(--accent)" }}
          >
            <FiAlertTriangle size={16} aria-hidden="true" />
          </div>

          <div>
            <h3 id="clear-team-title" className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
              Clear this team?
            </h3>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              This removes all {teamCount} selected Pokémon from your slots.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Keep Team
          </button>
          <button type="button" onClick={onConfirm} className="btn-danger">
            Clear Team
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClearTeamDialog;
