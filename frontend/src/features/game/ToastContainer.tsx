import { FiCheck, FiAlertCircle, FiInfo, FiX } from "react-icons/fi";
import type { Toast } from "./hooks/useToast";
import type { CSSProperties } from "react";

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

const ICON_MAP = {
  success: FiCheck,
  error: FiAlertCircle,
  info: FiInfo,
} as const;

const ACCENT_MAP = {
  success: { color: "#22c55e", bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.25)" },
  error: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.25)" },
  info: { color: "var(--accent-blue, #4f8aa3)", bg: "rgba(79,138,163,0.12)", border: "rgba(79,138,163,0.25)" },
} as const;

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast, i) => {
        const Icon = ICON_MAP[toast.type];
        const accent = ACCENT_MAP[toast.type];
        return (
          <div
            key={toast.id}
            className="app-toast"
            role="status"
            style={{ "--toast-index": i, "--toast-duration": `${toast.duration}ms` } as CSSProperties}
          >
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
              style={{ background: accent.bg, border: `1px solid ${accent.border}` }}
            >
              <Icon size={11} style={{ color: accent.color }} />
            </div>
            <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
              {toast.message}
            </span>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors"
              style={{ color: "var(--text-muted)" }}
              aria-label="Dismiss"
            >
              <FiX size={12} />
            </button>
            <div className="app-toast-progress">
              <div className="app-toast-progress-bar" style={{ background: accent.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
