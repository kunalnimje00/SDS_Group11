"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CircleUserRound, LogIn, LogOut, CheckCircle, Shield } from "lucide-react";
import { useKantin } from "@/app/kantin-context";
import { supabase, supabaseConfigError } from "@/lib/supabase";
import { PageHeading } from "./ui";
import { GoogleSignInButton } from "./google-sign-in-button";

export function ProfilePage() {
  const { user, signOut } = useKantin();
  const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || "");
  const [statusMsg, setStatusMsg] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleUpdateProfile(event) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setStatusMsg("");

    try {
      if (!supabase) throw new Error(supabaseConfigError);

      const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName.trim() },
      });
      if (error) throw error;
      setStatusMsg("Profile updated successfully!");
    } catch (err) {
      setStatusMsg(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  const userEmail = user?.email || "Guest Student";
  const userRole = user?.user_metadata?.role || "Student";

  return (
    <div className="page-stack">
      <PageHeading
        eyebrow="STUDENT ACCOUNT"
        title="Student Profile"
        description="Manage your campus account details, preferences, and session."
      />

      <section className="profile-preview-card">
        <div className="profile-preview-avatar">
          <CircleUserRound size={33} />
        </div>
        <div className="profile-preview-copy">
          <p className="eyebrow">{user ? "AUTHENTICATED SESSION" : "GUEST ACCESS"}</p>
          <h2>{user ? displayName || userEmail : "Guest Student"}</h2>
          <p>
            {user
              ? `${userEmail} · Connected via Supabase Auth`
              : "No account signed in. Sign in to sync your order history across devices."}
          </p>
        </div>
        {user ? (
          <button
            type="button"
            className="button button-secondary"
            onClick={signOut}
            style={{ display: "inline-flex", gap: "6px" }}
          >
            <LogOut size={16} /> Sign out
          </button>
        ) : (
          <Link href="/login" className="button button-primary">
            <LogIn size={16} /> Sign in
          </Link>
        )}
      </section>

      {user ? (
        <section className="profile-form-card">
          <p className="eyebrow">ACCOUNT SETTINGS</p>
          <h2>Display Name</h2>
          <p className="profile-form-description">
            This name appears on cafeteria order tokens and pickup receipts.
          </p>
          <form onSubmit={handleUpdateProfile}>
            <label className="field-label" htmlFor="display-name">
              Your name
            </label>
            <input
              className="text-input"
              id="display-name"
              placeholder="Enter your name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            {statusMsg && (
              <p className={statusMsg.includes("success") ? "inline-info" : "inline-error"} role="status">
                {statusMsg}
              </p>
            )}
            <button type="submit" className="button button-primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"} <ArrowRight size={16} />
            </button>
          </form>

          <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border)", fontSize: "11px", color: "var(--muted)" }}>
            <p><strong>User ID:</strong> <code style={{ color: "var(--mint)" }}>{user.id}</code></p>
            <p><strong>Campus Role:</strong> {userRole}</p>
          </div>
        </section>
      ) : (
        <section className="profile-form-card">
          <p className="eyebrow">READY TO SIGN IN?</p>
          <h2>Join your campus dining network</h2>
          <p className="profile-form-description">
            Sign up or log in to track your live order lanes, view past receipts, and enjoy quick re-ordering.
          </p>
          <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
            <Link href="/login" className="button button-primary">
              Sign In <ArrowRight size={16} />
            </Link>
            <Link href="/register" className="button button-secondary">
              Create an Account
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
