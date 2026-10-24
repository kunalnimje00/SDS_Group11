"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, KeyRound, CheckCircle, ShieldCheck } from "lucide-react";
import { useKantin } from "@/app/kantin-context";

const COEP_EMAIL_DOMAIN = "@coeptech.ac.in";
const COEP_EMAIL_ERROR = "Enter your COEP email name before the fixed @coeptech.ac.in suffix.";

function isValidCoepUsername(username) {
  return /^[a-zA-Z0-9._%+-]+$/.test(username.trim());
}

function getCoepEmail(username) {
  return `${username.trim().toLowerCase()}${COEP_EMAIL_DOMAIN}`;
}

function CoepEmailField({ id, username, onChange }) {
  return (
    <>
      <label className="field-label" htmlFor={id}>Student email</label>
      <div className="coep-email-field">
        <input
          className="text-input"
          id={id}
          type="text"
          inputMode="email"
          autoComplete="email"
          placeholder="your.email"
          pattern="[A-Za-z0-9._%+-]+"
          value={username}
          onChange={(event) => onChange(event.target.value)}
          required
          aria-describedby={`${id}-help`}
        />
        <span className="coep-email-domain">{COEP_EMAIL_DOMAIN}</span>
      </div>
      <p className="auth-description" id={`${id}-help`}>
        Enter your COEP email name; the campus domain is added automatically.
      </p>
    </>
  );
}

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
  const { signIn, user, authLoading } = useKantin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/");
    }
  }, [authLoading, router, user]);

  async function handleLogin(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!isValidCoepUsername(email)) {
      setErrorMsg(COEP_EMAIL_ERROR);
      return;
    }

    setLoading(true);

    try {
      await signIn(getCoepEmail(email), password);
      router.push("/");
    } catch (err) {
      setErrorMsg(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  }

  if (!authLoading && user) return null;

  return (
    <AuthFrame title="Good to see you." description="Sign in to your campus account to continue.">
      <form className="auth-form" onSubmit={handleLogin}>
        <CoepEmailField id="login-email" username={email} onChange={setEmail} />

        <div className="field-label-row">
          <label className="field-label" htmlFor="login-password">
            Password
          </label>
          <Link href="/forgot-password">Forgot password?</Link>
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

export function ForgotPasswordPage() {
  const router = useRouter();
  const { sendPasswordResetOtp, verifyPasswordResetOtp, updatePassword } = useKantin();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState("email");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendCode(event) {
    event.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!isValidCoepUsername(email)) {
      setErrorMsg(COEP_EMAIL_ERROR);
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetOtp(getCoepEmail(email));
      setStep("reset");
      setSuccessMsg("If an account exists for this email, a recovery code has been sent.");
    } catch (err) {
      setErrorMsg(err.message || "Could not send a recovery code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(event) {
    event.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("The passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await verifyPasswordResetOtp(getCoepEmail(email), code.trim());
      await updatePassword(password);
      setSuccessMsg("Password updated. Redirecting you to the app...");
      router.replace("/");
    } catch (err) {
      setErrorMsg(err.message || "Could not verify the code or update your password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthFrame
      eyebrow="ACCOUNT RECOVERY"
      title="Reset your password."
      description="Get a one-time recovery code at your COEP email and use it to set a new password."
    >
      {step === "email" ? (
        <form className="auth-form" onSubmit={handleSendCode}>
          <CoepEmailField id="recovery-email" username={email} onChange={setEmail} />
          {errorMsg && <p className="inline-error" role="alert">{errorMsg}</p>}
          <button className="button button-primary button-full" type="submit" disabled={loading}>
            {loading ? "Sending code..." : "Send recovery code"} <ArrowRight size={16} />
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleResetPassword}>
          <p className="auth-description">Enter the recovery code sent to {getCoepEmail(email)} and choose a new password.</p>
          <label className="field-label" htmlFor="recovery-code">Email code</label>
          <input
            className="text-input"
            id="recovery-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
          />
          <label className="field-label" htmlFor="recovery-password">New password</label>
          <input
            className="text-input"
            id="recovery-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
          />
          <label className="field-label" htmlFor="recovery-password-confirm">Confirm new password</label>
          <input
            className="text-input"
            id="recovery-password-confirm"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={6}
          />
          {errorMsg && <p className="inline-error" role="alert">{errorMsg}</p>}
          {successMsg && <p className="inline-info" role="status">{successMsg}</p>}
          <button className="button button-primary button-full" type="submit" disabled={loading}>
            {loading ? "Updating password..." : "Verify code and set password"} <ArrowRight size={16} />
          </button>
        </form>
      )}
      {step === "email" && successMsg && <p className="inline-info" role="status">{successMsg}</p>}
      <p className="auth-switch"><Link href="/login">Back to sign in</Link></p>
    </AuthFrame>
  );
}

export function RegisterPage() {
  const router = useRouter();
  const { signUp, verifyEmailOtp, resendEmailOtp, user, authLoading } = useKantin();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [verificationStep, setVerificationStep] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/");
    }
  }, [authLoading, router, user]);

  async function handleRegister(e) {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!isValidCoepUsername(email)) {
      setErrorMsg(COEP_EMAIL_ERROR);
      return;
    }

    setLoading(true);

    try {
      await signUp(getCoepEmail(email), password, name.trim());
      setVerificationStep(true);
      setSuccessMsg(
        "If this email can be registered, a verification code has been sent. Already have an account? Sign in or reset your password."
      );
    } catch (err) {
      setErrorMsg(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyEmail(event) {
    event.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      const data = await verifyEmailOtp(getCoepEmail(email), code.trim());
      if (data?.session) {
        router.replace("/");
      } else {
        setSuccessMsg("Email verified. You can now sign in.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Could not verify that code. Check it and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendEmailCode() {
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);
    try {
      await resendEmailOtp(getCoepEmail(email));
      setSuccessMsg("If this email can be registered, a new verification code has been sent.");
    } catch (err) {
      setErrorMsg(err.message || "Could not resend the verification code.");
    } finally {
      setLoading(false);
    }
  }

  if (!authLoading && user) return null;

  return (
    <AuthFrame
      eyebrow="NEW STUDENT"
      title="Make room for lunch."
      description="Create a student account to order directly from campus cafes."
    >
      {verificationStep ? (
        <form className="auth-form" onSubmit={handleVerifyEmail}>
          <p className="auth-description">Enter the one-time code sent to {getCoepEmail(email)}.</p>
          <label className="field-label" htmlFor="register-code">Email verification code</label>
          <input
            className="text-input"
            id="register-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
          />
          {errorMsg && <p className="inline-error" role="alert">{errorMsg}</p>}
          {successMsg && <p className="inline-info" role="status">{successMsg}</p>}
          <button className="button button-primary button-full" type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify email"} <ArrowRight size={16} />
          </button>
          <button className="button button-secondary button-full" type="button" onClick={handleResendEmailCode} disabled={loading}>
            Resend code
          </button>
        </form>
      ) : (
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

        <CoepEmailField id="register-email" username={email} onChange={setEmail} />

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
      )}

      <p className="auth-switch">
        Already registered? <Link href="/login">Sign in</Link> or <Link href="/forgot-password">reset password</Link>
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
