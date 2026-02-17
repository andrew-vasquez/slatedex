"use client";

import { useEffect, useState } from "react";

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

const UndoToast = ({ message, onUndo, onDismiss, duration = 5000 }: UndoToastProps) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, onDismiss]);

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
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default UndoToast;
