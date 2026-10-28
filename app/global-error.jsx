"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Global application crash:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{
        margin: 0,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: "#08110d",
        color: "#f3f6f2",
        textAlign: "center"
      }}>
        <div style={{ maxWidth: 480 }}>
          <h1 style={{ fontSize: "2rem", marginBottom: "12px", color: "#e08c82" }}>
            Critical Error
          </h1>
          <p style={{ color: "#9ba99f", marginBottom: "24px", lineHeight: 1.5 }}>
            {error?.message || "A critical error occurred. Please refresh or contact campus support."}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "10px 20px",
              background: "#91d4a8",
              color: "#08110d",
              fontWeight: 600,
              border: "none",
              borderRadius: "8px",
              cursor: "pointer"
            }}
          >
            Reload application
          </button>
        </div>
      </body>
    </html>
  );
}
