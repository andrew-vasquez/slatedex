"use client";

import { useState, useEffect, useRef } from "react";
import { loginWithIdentifier, registerWithEmail } from "@/lib/api";
import { FiX, FiEye, FiEyeOff } from "react-icons/fi";

type Tab = "sign-in" | "sign-up";

interface AuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatAuthError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.trim();
    if (/failed to fetch|networkerror|load failed/i.test(message)) {
      return "Unable to reach the auth server. Check NEXT_PUBLIC_API_URL on Vercel and FRONTEND_URL/BETTER_AUTH_URL on your API host (e.g. Cloudflare Workers secrets).";
    }
    return message.length > 0 ? message : "An unexpected error occurred";
  }

  return "An unexpected error occurred";
}

const PasswordInput = ({
  value,
  onChange,
  placeholder,
  autoComplete,
  id,
  name,
  errorId,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  autoComplete: string;
  id: string;
  name: string;
  errorId?: string;
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-input-wrap">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="auth-input auth-input--has-toggle"
        placeholder={placeholder}
        autoComplete={autoComplete}
        minLength={8}
        aria-describedby={errorId}
      />
      <button
        type="button"
        className="auth-pw-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {visible ? <FiEyeOff size={15} aria-hidden="true" /> : <FiEye size={15} aria-hidden="true" />}
      </button>
    </div>
  );
};

const AuthDialog = ({ isOpen, onClose }: AuthDialogProps) => {
  const [tab, setTab] = useState<Tab>("sign-in");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      setConfirmPassword("");
      setFirstName("");
      setLastName("");
    }
  }, [isOpen, tab]);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const submittedEmail = String(formData.get("email") ?? "").trim();
    const submittedPassword = String(formData.get("password") ?? "");

    if (!submittedEmail || !submittedPassword) {
      setError("Email and password are required");
      setLoading(false);
      return;
    }

    try {
      const result = await loginWithIdentifier(submittedEmail, submittedPassword);
      if (!result.ok) {
        setError(result.error ?? "Sign in failed");
      } else {
        onClose();
      }
    } catch (error) {
      setError(formatAuthError(error));
      console.error("Sign-in failed", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const submittedFirstName = String(formData.get("firstName") ?? "").trim();
    const submittedLastName = String(formData.get("lastName") ?? "").trim();
    const submittedEmail = String(formData.get("email") ?? "").trim();
    const submittedPassword = String(formData.get("password") ?? "");
    const submittedConfirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!submittedFirstName || !submittedEmail || !submittedPassword) {
      setError("First name, email, and password are required");
      return;
    }

    if (submittedPassword !== submittedConfirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const fullName = submittedLastName
      ? `${submittedFirstName} ${submittedLastName}`
      : submittedFirstName;

    try {
      const result = await registerWithEmail(fullName, submittedEmail, submittedPassword);
      if (!result.ok) {
        setError(result.error ?? "Sign up failed");
      } else {
        onClose();
      }
    } catch (error) {
      setError(formatAuthError(error));
      console.error("Sign-up failed", error);
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
      style={{ overscrollBehavior: "contain" }}
    >
      <div className="auth-dialog-content panel">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-lg leading-tight" style={{ color: "var(--text-primary)" }}>
              {tab === "sign-in" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="mt-0.5 text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
              {tab === "sign-in"
                ? "Sign in to access your saved teams."
                : "Join to save and sync your teams."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="auth-close-btn"
            aria-label="Close dialog"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: "var(--surface-2)" }}>
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
          <div className="auth-error" role="alert">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 mt-px">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {tab === "sign-in" ? (
          <form onSubmit={handleSignIn} className="flex flex-col gap-3">
            <label className="auth-field" htmlFor="signin-email">
              <span className="auth-label">Email or Username</span>
              <input
                id="signin-email"
                name="email"
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder={email.includes("@") ? "trainer@example.com" : "username"}
                autoComplete="username"
                spellCheck={false}
                autoCapitalize="none"
                autoCorrect="off"
              />
            </label>
            <label className="auth-field" htmlFor="signin-password">
              <span className="auth-label">Password</span>
              <PasswordInput
                id="signin-password"
                name="password"
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </label>
            <button type="submit" disabled={loading} className="auth-submit">
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="auth-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M12 2v4m0 12v4m-7.07-3.93 2.83-2.83m8.48-8.48 2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83" /></svg>
                  Signing in{"\u2026"}
                </span>
              ) : "Sign In"}
            </button>
            <p className="text-center text-[0.68rem] mt-1" style={{ color: "var(--text-muted)" }}>
              Don&apos;t have an account?{" "}
              <button type="button" className="auth-switch-link" onClick={() => setTab("sign-up")}>
                Sign up
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2.5">
              <label className="auth-field" htmlFor="signup-firstname">
                <span className="auth-label">First Name</span>
                <input
                  id="signup-firstname"
                  name="firstName"
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="auth-input"
                  placeholder="Ash"
                  autoComplete="given-name"
                />
              </label>
              <label className="auth-field" htmlFor="signup-lastname">
                <span className="auth-label">Last Name</span>
                <input
                  id="signup-lastname"
                  name="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="auth-input"
                  placeholder="Ketchum"
                  autoComplete="family-name"
                />
              </label>
            </div>
            <label className="auth-field" htmlFor="signup-email">
              <span className="auth-label">Email</span>
              <input
                id="signup-email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="trainer@example.com"
                autoComplete="email"
                spellCheck={false}
              />
            </label>
            <label className="auth-field" htmlFor="signup-password">
              <span className="auth-label">Password</span>
              <PasswordInput
                id="signup-password"
                name="password"
                value={password}
                onChange={setPassword}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </label>
            <label className="auth-field" htmlFor="signup-confirm">
              <span className="auth-label">Confirm Password</span>
              <PasswordInput
                id="signup-confirm"
                name="confirmPassword"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                errorId="confirm-pw-error"
              />
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <span id="confirm-pw-error" className="text-[0.65rem] mt-0.5" role="alert" style={{ color: "#ef4444" }}>
                  Passwords do not match
                </span>
              )}
            </label>
            <button
              type="submit"
              disabled={loading}
              className="auth-submit"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="auth-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M12 2v4m0 12v4m-7.07-3.93 2.83-2.83m8.48-8.48 2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83" /></svg>
                  Creating account{"\u2026"}
                </span>
              ) : "Create Account"}
            </button>
            <p className="text-center text-[0.68rem] mt-1" style={{ color: "var(--text-muted)" }}>
              Already have an account?{" "}
              <button type="button" className="auth-switch-link" onClick={() => setTab("sign-in")}>
                Sign in
              </button>
            </p>
          </form>
        )}
      </div>
    </dialog>
  );
};

export default AuthDialog;
