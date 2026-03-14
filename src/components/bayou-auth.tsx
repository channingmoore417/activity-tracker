"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Key, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "./bayou-auth.module.css";

type AuthMode = "login" | "signup";

function GoogleMark() {
  return (
    <svg aria-hidden="true" height="18" viewBox="0 0 24 24" width="18">
      <path
        d="M21.8 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.5a4.8 4.8 0 0 1-2 3.1v2.6h3.3c1.9-1.8 3-4.4 3-7.4Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.9-.9 6.6-2.4l-3.3-2.6c-.9.6-2 .9-3.3.9-2.5 0-4.7-1.7-5.4-4.1H3.2v2.7A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.6 13.8A6 6 0 0 1 6.3 12c0-.6.1-1.2.3-1.8V7.5H3.2A10 10 0 0 0 2 12c0 1.6.4 3.1 1.2 4.5l3.4-2.7Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.1c1.4 0 2.7.5 3.6 1.5l2.7-2.7A9.8 9.8 0 0 0 12 2a10 10 0 0 0-8.8 5.5l3.4 2.7c.7-2.4 2.9-4.1 5.4-4.1Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function BayouAuth() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (result.error) {
      setError(result.error.message);
      setIsSubmitting(false);
      return;
    }

    if (mode === "login") {
      router.push("/dashboard");
      router.refresh();
    } else {
      setMessage("Account created. Check your email if confirmation is enabled.");
    }

    setPassword("");
    setIsSubmitting(false);
  }

  async function handleForgotPassword() {
    setError(null);
    setMessage(null);

    if (!email) {
      setError("Enter your email address first.");
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setMessage("Password reset email sent.");
  }

  async function handleGoogleLogin() {
    setError(null);
    setMessage(null);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (oauthError) {
      setError(oauthError.message);
    }
  }

  return (
    <main className={styles.shell}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <svg width="260" height="58" viewBox="0 0 260 58" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="loginGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#172852"/>
                <stop offset="50%" stopColor="#008BC7"/>
                <stop offset="100%" stopColor="#3AABF0"/>
              </linearGradient>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#172852"/>
                <stop offset="100%" stopColor="#3AABF0"/>
              </linearGradient>
            </defs>
            <text x="0" y="42" fontFamily="'Poppins',sans-serif" fontSize="42" fontWeight="900" fill="url(#loginGrad)" letterSpacing="-2" fontStyle="italic">BAYOU OS</text>
            <line x1="0" y1="49" x2="255" y2="49" stroke="url(#lineGrad)" strokeWidth="1.5" opacity="0.35"/>
            <text x="1" y="58" fontFamily="'Poppins',sans-serif" fontSize="9" fontWeight="600" fill="#008BC7" letterSpacing="5">SALES OPERATING SYSTEM</text>
          </svg>
        </div>

        <div className={styles.tabs}>
          <button
            className={mode === "login" ? styles.tabActive : styles.tab}
            onClick={() => setMode("login")}
            type="button"
          >
            Sign In
          </button>
          <button
            className={mode === "signup" ? styles.tabActive : styles.tab}
            onClick={() => setMode("signup")}
            type="button"
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email Address
            </label>
            <div className={styles.inputWrap}>
              <input
                className={styles.input}
                id="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@bayoumortgage.com"
                required
                type="email"
                value={email}
              />
              <Mail className={styles.inputIcon} size={15} />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <div className={styles.inputWrap}>
              <input
                className={styles.inputPassword}
                id="password"
                onChange={(event) => setPassword(event.target.value)}
                required
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <Key className={styles.inputIcon} size={15} />
              <button
                className={styles.toggle}
                onClick={() => setShowPassword((value) => !value)}
                type="button"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className={styles.forgotRow}>
            <button className={styles.forgot} onClick={handleForgotPassword} type="button">
              Forgot password?
            </button>
          </div>

          <button className={styles.submit} disabled={isSubmitting} type="submit">
            {isSubmitting
              ? "Working..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        <div className={styles.divider}>
          <div className={styles.dividerLine} />
          <span className={styles.dividerText}>or continue with</span>
          <div className={styles.dividerLine} />
        </div>

        <button className={styles.sso} onClick={handleGoogleLogin} type="button">
          <GoogleMark />
          Continue with Google
        </button>

        {message ? <div className={styles.message}>{message}</div> : null}
        {error ? <div className={styles.error}>{error}</div> : null}
      </div>
    </main>
  );
}
