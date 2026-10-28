import Link from "next/link";
import { UtensilsCrossed, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
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
        background: "var(--mint-wash, rgba(145, 212, 168, 0.09))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--mint, #91d4a8)",
        marginBottom: 20
      }}>
        <UtensilsCrossed size={32} />
      </div>

      <p style={{
        fontSize: "12px",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--mint, #91d4a8)",
        marginBottom: 8
      }}>
        404 — Page Not Found
      </p>

      <h1 style={{
        fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
        fontWeight: 700,
        marginBottom: 12
      }}>
        This plate is empty
      </h1>

      <p style={{
        maxWidth: 420,
        color: "var(--muted, #9ba99f)",
        marginBottom: 28,
        lineHeight: 1.6
      }}>
        The page you are looking for does not exist, has been removed, or is temporarily unavailable.
      </p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        <Link href="/" className="button button-primary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <Home size={15} /> Back to Home
        </Link>
        <Link href="/cafes" className="button button-secondary" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <ArrowLeft size={15} /> Browse Cafes
        </Link>
      </div>
    </div>
  );
}
