"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function RootError({ error, reset }) {
  useEffect(() => {
    console.error("Unhandled client error:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      textAlign: "center",
      background: "var(--bg, #08110d)",
      color: "var(--text, #f3f6f2)"
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: "50%",
        background: "rgba(224, 140, 130, 0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--red, #e08c82)",
        marginBottom: 20
      }}>
        <AlertTriangle size={32} />
      </div>

      <p style={{
        fontSize: "12px",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--red, #e08c82)",
        marginBottom: 8
      }}>
        Application Error
      </p>

      <h1 style={{
        fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
        fontWeight: 700,
        marginBottom: 12
      }}>
        Something went wrong
      </h1>

      <p style={{
        maxWidth: 460,
        color: "var(--muted, #9ba99f)",
        marginBottom: 28,
        lineHeight: 1.6
      }}>
        {error?.message || "An unexpected error occurred while rendering this view. Please try again."}
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          type="button"
          onClick={() => reset()}
          className="button button-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <RefreshCw size={15} /> Try again
        </button>
        <Link href="/" className="button button-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Home size={15} /> Return Home
        </Link>
      </div>
    </div>
  );
}
