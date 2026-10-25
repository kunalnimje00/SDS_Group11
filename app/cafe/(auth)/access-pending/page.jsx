"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, RefreshCw, LogOut, ShieldAlert, User } from "lucide-react";
import { useKantin } from "@/app/kantin-context";
import { checkCafeStaffMembership } from "@/lib/cafe-auth";
import { supabase } from "@/lib/supabase";

export default function CafeAccessPendingPage() {
  const router = useRouter();
  const { user, signOut, authLoading } = useKantin();
  const [checking, setChecking] = useState(false);
  const [cafeName, setCafeName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/cafe/login"); return; }
    let isMounted = true;
    checkCafeStaffMembership().then(({ isStaff }) => { if (isMounted && isStaff) router.push("/cafe"); });
    return () => { isMounted = false; };
  }, [user, authLoading, router]);

  async function handleCheckAgain() {
    setChecking(true); setStatusMessage(""); setErrorMessage("");
    try {
      const { isStaff, error } = await checkCafeStaffMembership();
      if (isStaff) { router.push("/cafe"); }
      else if (error === "not_authenticated") { setErrorMessage("Session expired. Please sign in again."); router.push("/cafe/login"); }
      else if (error === "multiple_cafe_memberships") { setErrorMessage("Multiple cafe memberships detected. Contact administrator."); }
      else { setStatusMessage("Enter your cafe name below to finish setting up this account."); }
    } catch (err) { setErrorMessage(err.message || "Failed to check membership status."); }
    finally { setChecking(false); }
  }

  async function handleCompleteSetup(event) {
    event.preventDefault();
    setSubmitting(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      const { error } = await supabase.rpc("cafe_complete_registration", {
        p_cafe_name: cafeName.trim(),
      });
      if (error) throw error;

      const { isStaff, error: membershipError } = await checkCafeStaffMembership();
      if (!isStaff) {
        throw new Error(membershipError || "Cafe setup completed, but staff access could not be verified. Check access again.");
      }
      router.replace("/cafe");
    } catch (error) {
      setErrorMessage(error.message || "Could not finish cafe setup.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    try { await signOut(); router.push("/cafe/login"); }
    catch (err) { setErrorMessage(err.message || "Failed to sign out."); }
  }

  return (
    <main className="auth-page">
      <section className="auth-aside">
        <Link href="/" className="auth-brand">
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
          <span className="brand-name">kantin<span className="brand-period">.</span></span>
        </Link>
        <div className="auth-aside-copy">
          <p className="eyebrow">CAFETERIA PORTAL</p>
          <h1>Manage your<br />kitchen.</h1>
          <p>Track orders, update menus, and keep things flowing.</p>
        </div>
        <div className="auth-aside-footer"><span>KITCHEN OPERATIONS</span><span>Secured with Supabase Auth</span></div>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <Link href="/" className="back-link auth-back"><ArrowLeft size={15} /> Back to Kantin</Link>
          <p className="eyebrow auth-eyebrow">CAFETERIA ACCESS</p>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <div className="access-pending-icon"><ShieldAlert size={24} /></div>
            <h2 style={{ margin: 0, fontSize: 28 }}>Finish Cafe Setup</h2>
          </div>
          <p className="auth-description">Finish setting up your cafe account to access the dashboard.</p>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,.03)", border: "1px solid var(--border)", marginBottom: 16, fontSize: 11, color: "var(--text-soft)" }}>
              <User size={15} style={{ color: "var(--mint)", flexShrink: 0 }} />
              <span>Signed in as: <strong style={{ color: "var(--text)" }}>{user.email}</strong></span>
            </div>
          )}
          {statusMessage && <p className="inline-info" role="status" style={{ marginBottom: 14 }}>{statusMessage}</p>}
          {errorMessage && <p className="inline-error" role="alert" style={{ marginBottom: 14 }}>{errorMessage}</p>}
          <form className="auth-form" onSubmit={handleCompleteSetup}>
            <label className="field-label" htmlFor="cafe-setup-name">Cafe name</label>
            <input
              className="text-input"
              id="cafe-setup-name"
              type="text"
              autoComplete="organization"
              value={cafeName}
              onChange={(event) => setCafeName(event.target.value)}
              minLength={2}
              maxLength={100}
              required
            />
            <button className="button button-primary button-full" type="submit" disabled={submitting}>
              {submitting ? "Setting up cafe..." : "Finish cafe setup"} <ArrowRight size={16} />
            </button>
          </form>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
            <button className="button button-primary button-full" type="button" onClick={handleCheckAgain} disabled={checking}>
              <RefreshCw size={15} style={checking ? { animation: "spin 1s linear infinite" } : undefined} />
              {checking ? "Checking access..." : "Already finished? Check access"}
            </button>
            <button className="button button-secondary button-full" type="button" onClick={handleSignOut}><LogOut size={15} /> Sign out</button>
          </div>
          <div className="auth-divider"><span />Cafe Setup<span /></div>
          <div className="auth-note-card"><ShieldAlert size={17} /><span>This creates a new cafe and assigns this account as its only staff login. Existing cafe accounts cannot be claimed.</span></div>
          <p className="auth-switch">Looking for student ordering? <Link href="/login">Switch to Student Portal</Link></p>
        </div>
      </section>
    </main>
  );
}
