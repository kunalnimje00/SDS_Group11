"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, RefreshCw, LogOut, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { useKantin } from "@/app/providers";
import { checkCafeStaffMembership } from "@/lib/cafe-auth";

export default function CafeLoginPage() {
  const router = useRouter();
  const { user, signIn, signOut, authLoading } = useKantin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [pendingAccess, setPendingAccess] = useState(false);
  const [recheckLoading, setRecheckLoading] = useState(false);
  const [recheckMsg, setRecheckMsg] = useState("");

  useEffect(() => {
    if (authLoading || !user) return;
    let isMounted = true;
    checkCafeStaffMembership().then(({ isStaff }) => {
      if (!isMounted) return;
      if (isStaff) { router.push("/cafe"); } else { setPendingAccess(true); }
    });
    return () => { isMounted = false; };
  }, [user, authLoading, router]);

  async function handleLogin(e) {
    e.preventDefault();
    setErrorMsg(""); setRecheckMsg(""); setLoading(true);
    try {
      await signIn(email.trim(), password);
      const { isStaff } = await checkCafeStaffMembership();
      if (isStaff) { router.push("/cafe"); } else { setPendingAccess(true); }
    } catch (err) {
      setErrorMsg(err.message || "Failed to sign in. Please check your credentials.");
    } finally { setLoading(false); }
  }

  async function handleRecheck() {
    setRecheckLoading(true); setRecheckMsg(""); setErrorMsg("");
    try {
      const { isStaff, error } = await checkCafeStaffMembership();
      if (isStaff) { router.push("/cafe"); }
      else if (error === "not_authenticated") { setPendingAccess(false); setErrorMsg("Session expired. Please sign in again."); }
      else { setRecheckMsg("Cafe access is still not set up for this account. Contact the administrator."); }
    } catch (err) { setRecheckMsg(err.message || "Failed to check status."); }
    finally { setRecheckLoading(false); }
  }

  async function handleSignOut() {
    try { await signOut(); setPendingAccess(false); setEmail(""); setPassword(""); setRecheckMsg(""); setErrorMsg(""); }
    catch (err) { console.error("Sign out error:", err); }
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
        <div className="auth-aside-footer">
          <span>KITCHEN OPERATIONS</span>
          <span>Secured with Supabase Auth</span>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <Link href="/" className="back-link auth-back"><ArrowLeft size={15} /> Back to Kantin</Link>

          {pendingAccess ? (
            <div>
              <p className="eyebrow auth-eyebrow">CAFETERIA ACCESS</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div className="access-pending-icon" style={{ width: 44, height: 44, margin: 0 }}><ShieldCheck size={22} /></div>
                <h2 style={{ margin: 0 }}>Cafe Access Not Set Up</h2>
              </div>
              <p className="auth-description">This account is not assigned to a cafe. Contact the administrator to set up the cafe staff login.</p>
              {recheckMsg && <p className="inline-info" role="status" style={{ marginBottom: 14 }}>{recheckMsg}</p>}
              {errorMsg && <p className="inline-error" role="alert" style={{ marginBottom: 14 }}>{errorMsg}</p>}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
                <button className="button button-primary button-full" type="button" onClick={handleRecheck} disabled={recheckLoading}>
                  <RefreshCw size={15} style={recheckLoading ? { animation: "spin 1s linear infinite" } : undefined} />
                  {recheckLoading ? "Checking access..." : "Check access"}
                </button>
                <button className="button button-secondary button-full" type="button" onClick={handleSignOut}><LogOut size={15} /> Sign out</button>
              </div>
              <p className="auth-switch" style={{ marginTop: 22 }}>Need a student account? <Link href="/login">Student sign in</Link></p>
            </div>
          ) : (
            <div>
              <p className="eyebrow auth-eyebrow">CAFETERIA ACCESS</p>
              <h2>Staff Sign In</h2>
              <p className="auth-description">Sign in to manage kitchen orders, daily schedules, and menu items.</p>
              <form className="auth-form" onSubmit={handleLogin}>
                <label className="field-label" htmlFor="cafe-login-email">Staff email</label>
                <input className="text-input" id="cafe-login-email" type="email" autoComplete="email" placeholder="staff@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <div className="field-label-row"><label className="field-label" htmlFor="cafe-login-password">Password</label></div>
                <div className="password-field-wrap">
                  <input className="text-input" id="cafe-login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword((p) => !p)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errorMsg && <p className="inline-error" role="alert">{errorMsg}</p>}
                <button className="button button-primary button-full" type="submit" disabled={loading}>{loading ? "Signing in..." : "Continue to kitchen"} <ArrowRight size={16} /></button>
              </form>
              <p className="auth-switch">New cafe? <Link href="/cafe/register">Create a cafe account</Link></p>
              <div className="auth-divider"><span />Campus Staff<span /></div>
              <div className="auth-note-card"><ShieldCheck size={17} /><span>Register a new cafe account or sign in to an existing cafe.</span></div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
