"use client";

import { useState } from "react";
import { Settings, LogOut, User, Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { PageHeading } from "@/components/ui";
import { useCafe } from "@/app/cafe/providers";

export default function CafeSettingsPage() {
  const { user, cafeName, signOut } = useCafe();
  const [toast, setToast] = useState(null);

  function showToast(msg, type = "success") {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSignOut() {
    try { await signOut(); }
    catch (err) { showToast(err.message || "Failed to sign out", "error"); }
  }

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Staff";

  return (
    <div className="page-stack">
      <PageHeading eyebrow="CONFIGURATION" title="Settings" description="Cafeteria profile, account details, and session management." />

      {/* Profile section */}
      <div className="settings-section">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(145,212,168,.08)", border: "1px solid rgba(145,212,168,.22)", display: "grid", placeItems: "center", color: "var(--mint)", flexShrink: 0 }}>
            <User size={22} />
          </div>
          <div>
            <h3 style={{ margin: "0 0 2px" }}>{displayName}</h3>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: 10 }}>{user?.email || "No email"}</p>
          </div>
        </div>
        <div style={{ display: "grid", gap: 8, padding: "10px 0" }}>
          <div className="overview-list-item">
            <span style={{ color: "var(--muted)", fontSize: 10 }}>Cafeteria</span>
            <strong style={{ fontSize: 11 }}>{cafeName}</strong>
          </div>
          <div className="overview-list-item">
            <span style={{ color: "var(--muted)", fontSize: 10 }}>Role</span>
            <strong style={{ fontSize: 11 }}>Cafe Staff</strong>
          </div>
          <div className="overview-list-item">
            <span style={{ color: "var(--muted)", fontSize: 10 }}>User ID</span>
            <strong style={{ fontSize: 10, fontFamily: "monospace", color: "var(--muted)" }}>{user?.id?.slice(0, 8) || "—"}...</strong>
          </div>
        </div>
      </div>

      {/* Security note */}
      <div className="settings-section">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Shield size={16} style={{ color: "var(--mint)" }} />
          <h3>Security</h3>
        </div>
        <p>Cafeteria access is managed by campus administrators. You cannot modify your staff role or cafeteria assignment from this dashboard.</p>
        <div className="inline-info" style={{ marginTop: 8 }}>
          Password changes and account recovery are available through Supabase Auth. Contact your administrator for assistance.
        </div>
      </div>

      {/* Sign out */}
      <div className="settings-section">
        <h3>Session</h3>
        <p>Sign out of the cafeteria dashboard. You will need to sign in again to access operations.</p>
        <button className="button button-danger" onClick={handleSignOut}>
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
