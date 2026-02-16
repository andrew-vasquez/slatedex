"use client";

import { useState, useEffect, useRef } from "react";
import { signIn, signUp } from "@/lib/auth-client";
import { FiX } from "react-icons/fi";

type Tab = "sign-in" | "sign-up";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthDialog = ({ isOpen, onClose }: AuthDialogProps) => {
  const [tab, setTab] = useState<Tab>("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setError("");
      setEmail("");
      setPassword("");
      setName("");
    }
  }, [isOpen, tab]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message ?? "Sign in failed");
      } else {
        onClose();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signUp.email({ name, email, password });
      if (result.error) {
        setError(result.error.message ?? "Sign up failed");
      } else {
        onClose();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className="auth-dialog"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="auth-dialog-content panel">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg" style={{ color: "var(--text-primary)" }}>
            {tab === "sign-in" ? "Sign In" : "Create Account"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
            style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
            aria-label="Close dialog"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: "var(--surface-2)" }}>
          <button
            type="button"
            className="auth-tab"
            data-active={tab === "sign-in"}
            onClick={() => setTab("sign-in")}
          >
            Sign In
          </button>
          <button
            type="button"
            className="auth-tab"
            data-active={tab === "sign-up"}
            onClick={() => setTab("sign-up")}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-lg px-3 py-2 text-xs font-medium" style={{ background: "rgba(185, 28, 28, 0.15)", color: "#ef4444", border: "1px solid rgba(185, 28, 28, 0.3)" }}>
            {error}
          </div>
        )}

        {tab === "sign-in" ? (
          <form onSubmit={handleSignIn} className="flex flex-col gap-3">
            <label className="auth-field">
              <span className="auth-label">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="trainer@example.com"
                autoComplete="email"
              />
            </label>
            <label className="auth-field">
              <span className="auth-label">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="••••••••"
                autoComplete="current-password"
                minLength={8}
              />
            </label>
            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="flex flex-col gap-3">
            <label className="auth-field">
              <span className="auth-label">Name</span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="auth-input"
                placeholder="Ash Ketchum"
                autoComplete="name"
              />
            </label>
            <label className="auth-field">
              <span className="auth-label">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="trainer@example.com"
                autoComplete="email"
              />
            </label>
            <label className="auth-field">
              <span className="auth-label">Password</span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={8}
              />
            </label>
            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
};

export default AuthDialog;
