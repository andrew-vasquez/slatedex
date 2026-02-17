"use client";

import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

const UndoToast = ({ message, onUndo, onDismiss, duration = 5000 }: UndoToastProps) => {
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
