import * as Sentry from "@sentry/tanstackstart-react";
import type { ErrorComponentProps } from "@tanstack/react-router";
import { useEffect } from "react";

export function DefaultCatchBoundary({ error, reset }: ErrorComponentProps) {
  const digest = typeof error === "object" && error && "digest" in error ? String(error.digest) : null;

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div
      style={{
        margin: 0,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at 12% 14%, rgba(218,44,67,0.18), transparent 34%), radial-gradient(circle at 88% 20%, rgba(59,130,246,0.16), transparent 34%), linear-gradient(165deg, #050814 0%, #0a1020 46%, #050814 100%)",
        color: "#e7ecff",
        padding: "1.5rem",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "420px", width: "100%" }}>
        <div
          aria-hidden="true"
          style={{
            width: 72,
            height: 72,
            margin: "0 auto 1.25rem",
            borderRadius: 20,
            background: "rgba(218,44,67,0.12)",
            border: "1px solid rgba(218,44,67,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2rem",
          }}
        >
          !
        </div>
        <h1 style={{ fontSize: "1.35rem", fontWeight: 700, marginBottom: "0.5rem" }}>Something went wrong</h1>
        <p style={{ color: "#7f8cb0", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        {digest ? (
          <p
            style={{
              color: "#7f8cb0",
              fontSize: "0.72rem",
              marginBottom: "1.25rem",
              padding: "0.5rem 0.75rem",
              borderRadius: 10,
              background: "rgba(148,163,184,0.08)",
              border: "1px solid rgba(148,163,184,0.15)",
            }}
          >
            Error ID: {digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "0.625rem 1.5rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "#e7ecff",
            backgroundColor: "#da2c43",
            border: "none",
            borderRadius: 12,
            cursor: "pointer",
          }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
