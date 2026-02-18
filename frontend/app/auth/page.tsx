"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FiCheck, FiEye, FiEyeOff, FiLoader, FiX } from "react-icons/fi";
import { signUp } from "@/lib/auth-client";
import { useAuth } from "@/components/providers/AuthProvider";
import { checkUsernameAvailable, loginWithIdentifier, updateMyProfile } from "@/lib/api";
import { USERNAME_REGEX } from "@/lib/profile";
import Breadcrumb from "@/components/ui/Breadcrumb";

type Tab = "sign-in" | "sign-up";
type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

function resolveTab(mode: string | null): Tab {
  return mode === "sign-up" ? "sign-up" : "sign-in";
}

function formatAuthError(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.trim();
    if (/failed to fetch|networkerror|load failed/i.test(msg)) {
      return "Unable to reach the auth server. Please check your connection and try again.";
    }
    return msg.length > 0 ? msg : "An unexpected error occurred";
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

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  const queryTab = resolveTab(searchParams.get("mode"));

  const [tab, setTab] = useState<Tab>(queryTab);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [identifier, setIdentifier] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEmailIdentifier = identifier.includes("@");

  useEffect(() => {
    setTab(queryTab);
  }, [queryTab]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/teams");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (tab !== "sign-up") return;

    if (checkTimer.current) clearTimeout(checkTimer.current);
    const trimmed = username.trim().toLowerCase();

    if (!trimmed) {
      setUsernameStatus("idle");
      return;
    }

    if (!USERNAME_REGEX.test(trimmed)) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    checkTimer.current = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailable(trimmed);
        setUsernameStatus(result.available ? "available" : "taken");
      } catch {
        setUsernameStatus("idle");
      }
    }, 450);

    return () => {
      if (checkTimer.current) clearTimeout(checkTimer.current);
    };
  }, [tab, username]);

  function switchTab(next: Tab) {
    setError("");
    setTab(next);

    const params = new URLSearchParams(searchParams.toString());
    params.set("mode", next);
    router.replace(`/auth?${params.toString()}`, { scroll: false });
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const result = await loginWithIdentifier(identifier.trim(), signInPassword);
      if (!result.ok) {
        setError(result.error ?? "Sign in failed");
        return;
      }

      router.push("/teams");
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (signUpPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    const trimmedUsername = username.trim().toLowerCase();
    if (trimmedUsername && usernameStatus === "taken") {
      setError("That username is already taken. Please choose another.");
      return;
    }

    if (trimmedUsername && usernameStatus === "invalid") {
      setError("Username must be 3-30 characters: lowercase letters, numbers, and underscores only.");
      return;
    }

    setSubmitting(true);

    const fullName = lastName.trim()
      ? `${firstName.trim()} ${lastName.trim()}`
      : firstName.trim();

    try {
      const result = await signUp.email({ name: fullName, email: email.trim(), password: signUpPassword });
      if (result.error) {
        setError(result.error.message ?? "Sign up failed");
        return;
      }

      if (trimmedUsername) {
        try {
          await updateMyProfile({ username: trimmedUsername });
        } catch {
          // Non-fatal: user can set username later from profile settings.
        }
      }

      router.push("/teams");
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-gradient)" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="skeleton h-7 w-24 rounded-xl" />
          <div className="skeleton h-4 w-40 rounded-lg" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  const usernameHint = (() => {
    switch (usernameStatus) {
      case "checking":
        return {
          icon: <FiLoader size={12} className="animate-spin" />,
          text: "Checking...",
          color: "var(--text-muted)",
        };
      case "available":
        return { icon: <FiCheck size={12} strokeWidth={3} />, text: "Available", color: "#34d399" };
      case "taken":
        return { icon: <FiX size={12} strokeWidth={3} />, text: "Already taken", color: "#f87171" };
      case "invalid":
        return {
          icon: <FiX size={12} strokeWidth={3} />,
          text: "3-30 chars, lowercase letters, numbers, underscores",
          color: "#f87171",
        };
      default:
        return null;
    }
  })();

  const pwMatch = confirmPassword.length > 0 && signUpPassword === confirmPassword;
  const pwMismatch = confirmPassword.length > 0 && signUpPassword !== confirmPassword;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: "var(--bg-gradient)" }}>
      <Breadcrumb
        items={[{ label: "Slatedex", href: "/" }, { label: tab === "sign-in" ? "Sign In" : "Create Account" }]}
        className="w-full max-w-sm mb-6"
      />

      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-3xl leading-none" style={{ letterSpacing: "-0.025em", textDecoration: "none" }}>
            <span style={{ color: "var(--text-primary)" }}>Slate</span>
            <span style={{ color: "var(--accent)" }}>dex</span>
          </Link>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            {tab === "sign-in"
              ? "Sign in to access your saved teams"
              : "Save and sync your teams across devices"}
          </p>
        </div>

        <div className="panel p-6">
          <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: "var(--surface-2)" }}>
            <button
              type="button"
              className="auth-tab"
              data-active={tab === "sign-in"}
              onClick={() => switchTab("sign-in")}
            >
              Sign In
            </button>
            <button
              type="button"
              className="auth-tab"
              data-active={tab === "sign-up"}
              onClick={() => switchTab("sign-up")}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="auth-error mb-4" role="alert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 mt-px">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {tab === "sign-in" ? (
            <form onSubmit={handleSignIn} className="flex flex-col gap-4">
              <label className="auth-field" htmlFor="identifier">
                <span className="auth-label">Email or Username</span>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="auth-input"
                  placeholder={isEmailIdentifier ? "trainer@example.com" : "ash_ketchum"}
                  autoComplete="username email"
                  spellCheck={false}
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </label>

              <label className="auth-field" htmlFor="signInPassword">
                <span className="auth-label">Password</span>
                <PasswordInput
                  id="signInPassword"
                  name="signInPassword"
                  value={signInPassword}
                  onChange={setSignInPassword}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </label>

              <button type="submit" disabled={submitting} className="auth-submit mt-1">
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="auth-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                      <path d="M12 2v4m0 12v4m-7.07-3.93 2.83-2.83m8.48-8.48 2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83" />
                    </svg>
                    Signing in...
                  </span>
                ) : "Sign In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-2.5">
                <label className="auth-field" htmlFor="firstName">
                  <span className="auth-label">First Name</span>
                  <input
                    id="firstName"
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
                <label className="auth-field" htmlFor="lastName">
                  <span className="auth-label">Last Name</span>
                  <input
                    id="lastName"
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

              <label className="auth-field" htmlFor="email">
                <span className="auth-label">Email</span>
                <input
                  id="email"
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

              <div className="auth-field">
                <label htmlFor="username" className="auth-label flex items-center gap-1.5">
                  Username
                  <span className="rounded-full px-1.5 py-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.1em]" style={{ background: "rgba(148,163,184,0.1)", color: "var(--text-muted)" }}>
                    optional
                  </span>
                </label>
                <div className="relative">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-xs select-none"
                    style={{ color: "var(--text-muted)" }}
                    aria-hidden="true"
                  >
                    @
                  </span>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="auth-input"
                    style={{ paddingLeft: "1.625rem" }}
                    placeholder="ash_ketchum"
                    autoComplete="username"
                    spellCheck={false}
                    autoCapitalize="none"
                    autoCorrect="off"
                    maxLength={30}
                  />
                </div>

                {usernameHint ? (
                  <div className="mt-0.5 flex items-center gap-1" style={{ color: usernameHint.color }}>
                    {usernameHint.icon}
                    <span className="text-[0.62rem]">{usernameHint.text}</span>
                  </div>
                ) : (
                  <p className="mt-0.5 text-[0.62rem]" style={{ color: "var(--text-muted)" }}>
                    Your public profile URL - you can set or change this later.
                  </p>
                )}
              </div>

              <label className="auth-field" htmlFor="signUpPassword">
                <span className="auth-label">Password</span>
                <PasswordInput
                  id="signUpPassword"
                  name="signUpPassword"
                  value={signUpPassword}
                  onChange={setSignUpPassword}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </label>

              <div className="auth-field">
                <span className="auth-label">Confirm Password</span>
                <div className="relative">
                  <PasswordInput
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    errorId="confirm-pw-error"
                  />
                  {pwMatch && (
                    <span className="absolute right-10 top-1/2 -translate-y-1/2" style={{ color: "#34d399" }}>
                      <FiCheck size={14} strokeWidth={3} />
                    </span>
                  )}
                </div>
                {pwMismatch && (
                  <span id="confirm-pw-error" className="mt-0.5 text-[0.65rem]" role="alert" style={{ color: "#ef4444" }}>
                    Passwords do not match
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || usernameStatus === "taken" || usernameStatus === "invalid"}
                className="auth-submit mt-1"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="auth-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                      <path d="M12 2v4m0 12v4m-7.07-3.93 2.83-2.83m8.48-8.48 2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83" />
                    </svg>
                    Creating account...
                  </span>
                ) : "Create Free Account"}
              </button>
            </form>
          )}

          <p className="mt-5 text-center text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
            {tab === "sign-in" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              className="auth-switch-link"
              onClick={() => switchTab(tab === "sign-in" ? "sign-up" : "sign-in")}
            >
              {tab === "sign-in" ? "Create one free" : "Sign in"}
            </button>
          </p>
        </div>

        <p className="mt-6 text-center text-[0.65rem] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          By continuing you agree to our{" "}
          <Link href="/terms" style={{ color: "var(--text-secondary)", textDecoration: "underline", textUnderlineOffset: "2px" }}>
            Terms
          </Link>
          {" "}and{" "}
          <Link href="/privacy" style={{ color: "var(--text-secondary)", textDecoration: "underline", textUnderlineOffset: "2px" }}>
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
