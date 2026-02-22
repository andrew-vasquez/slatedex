"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" style={{ colorScheme: "dark" }}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          background:
            "radial-gradient(circle at 12% 14%, rgba(218,44,67,0.18), transparent 34%), radial-gradient(circle at 88% 20%, rgba(59,130,246,0.16), transparent 34%), linear-gradient(165deg, #050814 0%, #0a1020 46%, #050814 100%)",
          color: "#e7ecff",
        }}
      >
        <div style={{ textAlign: "center", padding: "1.5rem", maxWidth: "420px", width: "100%" }}>
          <div
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
            aria-hidden="true"
          >
            ⚠️
          </div>
          <h1
            style={{
              fontSize: "1.35rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
              fontFamily: "'Chakra Petch', sans-serif",
              letterSpacing: "-0.01em",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              color: "#7f8cb0",
              fontSize: "0.9rem",
              lineHeight: 1.6,
              marginBottom: "1.5rem",
            }}
          >
            An unexpected error occurred. Please try again.
          </p>
          {error.digest && (
            <p
              style={{
                color: "#7f8cb0",
                fontSize: "0.72rem",
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: "1.25rem",
                padding: "0.5rem 0.75rem",
                borderRadius: 10,
                background: "rgba(148,163,184,0.08)",
                border: "1px solid rgba(148,163,184,0.15)",
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
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
                borderRadius: "12px",
                cursor: "pointer",
                transition: "opacity 0.15s, transform 0.15s",
              }}
              onMouseOver={(e) => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "scale(0.98)"; }}
              onMouseOut={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "scale(1)"; }}
              onFocus={(e) => { e.currentTarget.style.boxShadow = "0 0 0 3px rgba(218,44,67,0.35)"; }}
              onBlur={(e) => { e.currentTarget.style.boxShadow = "none"; }}
            >
              Try Again
            </button>
            <a
              href="/"
              style={{
                padding: "0.625rem 1.5rem",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#b8c0d9",
                backgroundColor: "rgba(148,163,184,0.12)",
                border: "1px solid rgba(148,163,184,0.25)",
                borderRadius: "12px",
                cursor: "pointer",
                textDecoration: "none",
                transition: "opacity 0.15s, border-color 0.15s",
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = "rgba(148,163,184,0.45)"; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = "rgba(148,163,184,0.25)"; }}
            >
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
