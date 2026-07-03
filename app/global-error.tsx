"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#f4f5fa", color: "#2e263d" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Application error</h2>
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#6d6b77", maxWidth: "28rem", textAlign: "center" }}>
            {error.message || "A critical error occurred. Please refresh the page."}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.625rem 1.25rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#3b5bdb",
              color: "#fff",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
