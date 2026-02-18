"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff, FiCheck } from "react-icons/fi";
import { signUp } from "@/lib/auth-client";
import { useAuth } from "@/components/providers/AuthProvider";
import Breadcrumb from "@/components/ui/Breadcrumb";

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
  errorId,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  autoComplete: string;
  id: string;
  errorId?: string;
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="auth-input-wrap">
      <input
        id={id}
        name={id}
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

export default function SignupPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/teams");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    const fullName = lastName.trim()
      ? `${firstName.trim()} ${lastName.trim()}`
      : firstName.trim();
    try {
      const result = await signUp.email({ name: fullName, email, password });
      if (result.error) {
        setError(result.error.message ?? "Sign up failed");
      } else {
        router.push("/teams");
      }
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const pwMatch = confirmPassword.length > 0 && password === confirmPassword;
  const pwMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  if (isLoading) return null;
  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12" style={{ background: "var(--bg-gradient)" }}>
      {/* Back link */}
      <Breadcrumb
        items={[{ label: "Slatedex", href: "/" }, { label: "Create Account" }]}
        className="w-full max-w-sm mb-6"
      />

      <div className="w-full max-w-sm">
        {/* Wordmark */}
        <div className="mb-8 text-center">
          <Link href="/" className="font-display text-3xl leading-none" style={{ letterSpacing: "-0.025em", textDecoration: "none" }}>
            <span style={{ color: "var(--text-primary)" }}>Slate</span>
            <span style={{ color: "var(--accent)" }}>dex</span>
          </Link>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            Save and sync your teams across devices
          </p>
        </div>

        {/* Benefits */}
        <div className="mb-5 flex flex-col gap-1.5">
          {[
            "Save unlimited teams per generation",
            "Access your teams from any device",
            "Share your public trainer profile",
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2.5">
              <span
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                style={{ background: "rgba(19,111,58,0.2)", color: "#34d399" }}
              >
                <FiCheck size={10} strokeWidth={3} />
              </span>
              <span className="text-[0.72rem]" style={{ color: "var(--text-secondary)" }}>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="panel p-6">
          {error && (
            <div className="auth-error mb-4" role="alert">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 mt-px">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
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

            <label className="auth-field" htmlFor="password">
              <span className="auth-label">Password</span>
              <PasswordInput
                id="password"
                value={password}
                onChange={setPassword}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </label>

            <div className="auth-field">
              <span className="auth-label">Confirm Password</span>
              <div className="relative">
                <PasswordInput
                  id="confirmPassword"
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

            <button type="submit" disabled={submitting} className="auth-submit mt-1">
              {submitting ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="auth-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M12 2v4m0 12v4m-7.07-3.93 2.83-2.83m8.48-8.48 2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83" />
                  </svg>
                  Creating account…
                </span>
              ) : "Create Free Account"}
            </button>
          </form>

          <p className="mt-5 text-center text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
            Already have an account?{" "}
            <Link href="/login" className="auth-switch-link" style={{ textDecoration: "none" }}>
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-[0.65rem] leading-relaxed" style={{ color: "var(--text-muted)" }}>
          By creating an account you agree to our{" "}
          <Link href="/terms" style={{ color: "var(--text-secondary)", textDecoration: "underline", textUnderlineOffset: "2px" }}>
            Terms of Service
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
