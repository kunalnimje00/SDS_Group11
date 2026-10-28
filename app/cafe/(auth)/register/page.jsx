"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, CheckCircle, ShieldCheck } from "lucide-react";
import { useKantin } from "@/app/kantin-context";
import { GoogleSignInButton } from "@/components/google-sign-in-button";

export default function CafeRegisterPage() {
  const router = useRouter();
  const { signUp } = useKantin();
  const [name, setName] = useState("");
  const [cafeName, setCafeName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  async function handleRegister(event) {
    event.preventDefault();
    setErrorMsg("");
    if (name.trim().length < 2) {
      setErrorMsg("Enter your name (at least 2 characters).");
      return;
    }
    if (cafeName.trim().length < 2) {
      setErrorMsg("Enter a cafe name (at least 2 characters).");
      return;
    }
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email.trim(), password, name.trim(), cafeName.trim());
      if (result.session) {
        router.replace("/cafe");
      } else {
        setNeedsEmailConfirmation(true);
      }
    } catch (error) {
      setErrorMsg(error.message || "Failed to create your cafe account.");
    } finally {
      setLoading(false);
    }
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
          <p>Create your cafe account and start managing orders.</p>
        </div>
        <div className="auth-aside-footer"><span>KITCHEN OPERATIONS</span><span>Secured with Supabase Auth</span></div>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <Link href="/" className="back-link auth-back"><ArrowLeft size={15} /> Back to Kantin</Link>
          {needsEmailConfirmation ? (
            <div>
              <p className="eyebrow auth-eyebrow">CHECK YOUR EMAIL</p>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div className="access-pending-icon" style={{ width: 44, height: 44, margin: 0 }}><CheckCircle size={22} /></div>
                <h2 style={{ margin: 0 }}>Cafe Account Created</h2>
              </div>
              <p className="auth-description">Confirm your email address, then sign in with the account you created. Your cafe and staff access are set up automatically.</p>
              <Link href="/cafe/login" className="button button-primary button-full">Go to staff sign in <ArrowRight size={16} /></Link>
            </div>
          ) : (
            <div>
              <p className="eyebrow auth-eyebrow">CREATE A CAFE ACCOUNT</p>
              <h2>Register your cafe</h2>
              <p className="auth-description">Create a cafe and its first staff login. You will be able to sign in as soon as your account is ready.</p>
              <GoogleSignInButton nextPath="/cafe/access-pending" label="Register with Google" />
              <div className="auth-divider"><span />or register with email & password<span /></div>
              <form className="auth-form" onSubmit={handleRegister}>
                <label className="field-label" htmlFor="cafe-register-owner">Your name</label>
                <input className="text-input" id="cafe-register-owner" type="text" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={100} />
                <label className="field-label" htmlFor="cafe-register-name">Cafe name</label>
                <input className="text-input" id="cafe-register-name" type="text" autoComplete="organization" value={cafeName} onChange={(event) => setCafeName(event.target.value)} required minLength={2} maxLength={100} />
                <label className="field-label" htmlFor="cafe-register-email">Email</label>
                <input className="text-input" id="cafe-register-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                <label className="field-label" htmlFor="cafe-register-password">Password</label>
                <div className="password-field-wrap">
                  <input className="text-input" id="cafe-register-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <label className="field-label" htmlFor="cafe-register-confirm-password">Confirm password</label>
                <div className="password-field-wrap">
                  <input className="text-input" id="cafe-register-confirm-password" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} />
                  <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? "Hide password" : "Show password"}>
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errorMsg && <p className="inline-error" role="alert">{errorMsg}</p>}
                <button className="button button-primary button-full" type="submit" disabled={loading}>
                  {loading ? "Creating cafe account..." : "Create cafe account"} <ArrowRight size={16} />
                </button>
              </form>
              <p className="auth-switch">Already have a cafe account? <Link href="/cafe/login">Sign in</Link></p>
              <div className="auth-note-card"><ShieldCheck size={17} /><span>Anyone can register. Each signup creates a new cafe with one staff login.</span></div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
