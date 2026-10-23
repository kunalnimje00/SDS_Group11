"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, KeyRound, CheckCircle, ShieldCheck } from "lucide-react";
import { useKantin } from "@/app/providers";

function AuthFrame({ children, title, description, eyebrow = "STUDENT ACCESS" }) {
  return (
    <main className="auth-page">
      <section className="auth-aside">
        <Link href="/" className="auth-brand">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="brand-name">
            kantin<span className="brand-period">.</span>
          </span>
        </Link>
        <div className="auth-aside-copy">
          <p className="eyebrow">SMART CAFETERIA</p>
          <h1>Your next meal<br />starts here.</h1>
          <p>Order food in seconds, skip the lunch lines, and track your prep in real time.</p>
        </div>
        <div className="auth-aside-footer">
          <span>CAMPUS ORDERING</span>
          <span>Secured with Supabase Auth</span>
        </div>
      </section>

      <section className="auth-form-side">
        <div className="auth-form-wrap">
          <Link href="/" className="back-link auth-back">
            <ArrowLeft size={15} /> Back to dashboard
          </Link>
          <p className="eyebrow auth-eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p className="auth-description">{description}</p>
          {children}
        </div>
      </section>
    </main>
  );
}

export function LoginPage() {
  const router = useRouter();
  const { signIn } = useKantin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      await signIn(email.trim(), password);
      router.push("/");
    } catch (err) {
      setErrorMsg(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame title="Good to see you." description="Sign in to your campus account to continue.">
      <form className="auth-form" onSubmit={handleLogin}>
        <label className="field-label" htmlFor="login-email">
          Student email
        </label>
        <input
          className="text-input"
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@college.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="field-label-row">
          <label className="field-label" htmlFor="login-password">
            Password
          </label>
        </div>
        <input
          className="text-input"
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {errorMsg && (
          <p className="inline-error" role="alert">
            {errorMsg}
          </p>
        )}

        <button className="button button-primary button-full" type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Continue"} <ArrowRight size={16} />
        </button>
      </form>

      <p className="auth-switch">
        New to Kantin? <Link href="/register">Create an account</Link>
      </p>

      <div className="auth-divider">
        <span />Campus Auth<span />
      </div>

      <div className="auth-note-card">
        <ShieldCheck size={17} />
        <span>Authenticated through your college Supabase database.</span>
      </div>
    </AuthFrame>
  );
}

export function RegisterPage() {
  const router = useRouter();
  const { signUp } = useKantin();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const data = await signUp(email.trim(), password, name.trim());
      if (data?.session) {
        router.push("/");
      } else {
        setSuccessMsg("Account created! Check your email for confirmation or proceed to login.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame
      eyebrow="NEW STUDENT"
      title="Make room for lunch."
      description="Create a student account to order directly from campus cafes."
    >
      <form className="auth-form" onSubmit={handleRegister}>
        <label className="field-label" htmlFor="register-name">
          Full name
        </label>
        <input
          className="text-input"
          id="register-name"
          type="text"
          autoComplete="name"
          placeholder="e.g. Alex Sharma"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label className="field-label" htmlFor="register-email">
          Student email
        </label>
        <input
          className="text-input"
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder="you@college.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="field-label" htmlFor="register-password">
          Password
        </label>
        <input
          className="text-input"
          id="register-password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a secure password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {errorMsg && (
          <p className="inline-error" role="alert">
            {errorMsg}
          </p>
        )}
        {successMsg && (
          <p className="inline-info" role="status">
            {successMsg}
          </p>
        )}

        <button className="button button-primary button-full" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create account"} <ArrowRight size={16} />
        </button>
      </form>

      <p className="auth-switch">
        Already registered? <Link href="/login">Sign in</Link>
      </p>
    </AuthFrame>
  );
}

export function OnboardingPage() {
  const router = useRouter();
  const { user } = useKantin();
  const [displayName, setDisplayName] = useState("");

  return (
    <AuthFrame
      eyebrow="WELCOME"
      title="A name to call you."
      description="Set a display name for your campus food pickup tokens."
    >
      <form
        className="auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          router.push("/");
        }}
      >
        <label className="field-label" htmlFor="profile-display-name">
          Display name
        </label>
        <input
          className="text-input"
          id="profile-display-name"
          type="text"
          placeholder="How should the kitchen address you?"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
        <button className="button button-primary button-full" type="submit">
          Save and go to menu <ArrowRight size={16} />
        </button>
      </form>
    </AuthFrame>
  );
}
