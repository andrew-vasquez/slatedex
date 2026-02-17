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
          backgroundColor: "#060914",
          color: "#e7ecff",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: "480px" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>💥</div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              marginBottom: "0.5rem",
              fontFamily: "'Chakra Petch', sans-serif",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              color: "#7f8cb0",
              fontSize: "0.95rem",
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
                fontSize: "0.75rem",
                fontFamily: "'JetBrains Mono', monospace",
                marginBottom: "1.5rem",
              }}
            >
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              padding: "0.625rem 1.5rem",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "#e7ecff",
              backgroundColor: "#da2c43",
              border: "none",
              borderRadius: "12px",
              cursor: "pointer",
              transition: "opacity 0.15s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.opacity = "0.85")}
            onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
