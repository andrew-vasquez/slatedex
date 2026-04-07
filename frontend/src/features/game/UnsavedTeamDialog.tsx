import { useEffect } from "react";
import { FiSave } from "react-icons/fi";

interface UnsavedTeamDialogProps {
  isOpen: boolean;
  targetGameName?: string;
  leavingBuilder?: boolean;
  canSave: boolean;
  isSaving: boolean;
  errorMessage?: string | null;
  onSaveAndContinue: () => void;
  onContinueWithoutSaving: () => void;
  onCancel: () => void;
}

const UnsavedTeamDialog = ({
  isOpen,
  targetGameName,
  leavingBuilder = false,
  canSave,
  isSaving,
  errorMessage,
  onSaveAndContinue,
  onContinueWithoutSaving,
  onCancel,
}: UnsavedTeamDialogProps) => {
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
    <div className="fixed inset-0 z-[92] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="unsaved-team-title">
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
            style={{ background: "var(--version-color-soft, var(--accent-soft))", border: "1px solid var(--version-color-border, rgba(218, 44, 67, 0.24))", color: "var(--version-color, var(--accent))" }}
          >
            <FiSave size={16} aria-hidden="true" />
          </div>

          <div>
            <h3 id="unsaved-team-title" className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
              Save current team?
            </h3>
            <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
              {leavingBuilder
                ? "You have unsaved Pokémon in your current team. Save before leaving Team Builder?"
                : `You have unsaved Pokémon in your current team. Save before switching to ${targetGameName ?? "the selected game"}?`}
            </p>
            {!canSave && (
              <p className="mt-1.5 text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
                Sign in to save teams across sessions.
              </p>
            )}
            {errorMessage ? (
              <p className="mt-1.5 text-[0.72rem]" style={{ color: "#fca5a5" }}>
                {errorMessage}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="btn-secondary" disabled={isSaving}>
            Cancel
          </button>
          <button type="button" onClick={onContinueWithoutSaving} className="btn-secondary" disabled={isSaving}>
            Continue Without Saving
          </button>
          {canSave ? (
            <button
              type="button"
              onClick={onSaveAndContinue}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold"
              style={{
                background: "var(--version-color, var(--accent))",
                color: "#fff",
                border: "1px solid var(--version-color-border, rgba(218, 44, 67, 0.48))",
                transition: "transform 0.2s ease, filter 0.2s ease",
              }}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save & Continue"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default UnsavedTeamDialog;
