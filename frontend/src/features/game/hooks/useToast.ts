import { createContext, useCallback, useContext, useRef, useState } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

export interface ToastAPI {
  toasts: Toast[];
  show: (message: string, type?: ToastType, duration?: number) => string;
  success: (msg: string, dur?: number) => string;
  error: (msg: string, dur?: number) => string;
  info: (msg: string, dur?: number) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastAPI | null>(null);

export function useToastContext(): ToastAPI {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToastContext must be used within a ToastProvider");
  return ctx;
}

let toastCounter = 0;

export function useToast(): ToastAPI {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, type: ToastType = "info", duration = 3500) => {
      const id = `toast-${++toastCounter}`;
      const toast: Toast = { id, message, type, duration };
      setToasts((prev) => [...prev.slice(-4), toast]);
      const timer = setTimeout(() => dismiss(id), duration);
      timersRef.current.set(id, timer);
      return id;
    },
    [dismiss]
  );

  const success = useCallback((msg: string, dur?: number) => show(msg, "success", dur), [show]);
  const error = useCallback((msg: string, dur?: number) => show(msg, "error", dur), [show]);
  const info = useCallback((msg: string, dur?: number) => show(msg, "info", dur), [show]);

  const api = useRef<ToastAPI>({} as ToastAPI);
  api.current.toasts = toasts;
  api.current.show = show;
  api.current.success = success;
  api.current.error = error;
  api.current.info = info;
  api.current.dismiss = dismiss;

  return api.current;
}

export { ToastContext };
