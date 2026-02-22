"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onRedo?: () => void;
  canRedo?: boolean;
  onDismiss: () => void;
  duration?: number;
}

const UndoToast = ({ message, onUndo, onRedo, canRedo, onDismiss, duration = 5000 }: UndoToastProps) => {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const timeout = setTimeout(() => {
      onDismissRef.current();
    }, duration);

    return () => clearTimeout(timeout);
  }, [duration]);

  return (
    <div className="undo-toast" role="alert">
      <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
        {message}
      </span>
      <button
        type="button"
        onClick={onUndo}
        className="undo-toast-btn"
      >
        Undo
      </button>
      {onRedo && canRedo && (
        <button
          type="button"
          onClick={onRedo}
          className="undo-toast-btn"
          style={{ background: "var(--surface-3, var(--surface-2))", border: "1px solid var(--border)" }}
        >
          Redo
        </button>
      )}
      <div className="undo-toast-progress">
        <div
          className="undo-toast-progress-bar"
          style={{ "--undo-duration": `${duration}ms` } as CSSProperties}
        />
      </div>
    </div>
  );
};

export default UndoToast;
