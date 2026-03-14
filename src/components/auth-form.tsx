"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

const authCopy: Record<
  AuthMode,
  {
    title: string;
    description: string;
    buttonLabel: string;
    alternateHref: string;
    alternateLabel: string;
  }
> = {
  login: {
    title: "Log in",
    description: "Sign in with your email and password.",
    buttonLabel: "Log in",
    alternateHref: "/signup",
    alternateLabel: "Need an account? Sign up",
  },
  signup: {
    title: "Sign up",
    description: "Create an account with your email and password.",
    buttonLabel: "Sign up",
    alternateHref: "/login",
    alternateLabel: "Already have an account? Log in",
  },
};

export function AuthForm({ mode }: AuthFormProps) {
  const supabase = createClient();
  const copy = authCopy[mode];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<Session | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (isMounted) {
        setSession(currentSession);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    const authMethod =
      mode === "signup"
        ? supabase.auth.signUp({ email, password })
        : supabase.auth.signInWithPassword({ email, password });

    const { error: authError } = await authMethod;

    if (authError) {
      setError(authError.message);
      setIsSubmitting(false);
      return;
    }

    setMessage(
      mode === "signup"
        ? "Signup successful. Check your email if confirmation is enabled."
        : "Logged in successfully.",
    );
    setPassword("");
    setIsSubmitting(false);
  }

  async function handleSignOut() {
    setError(null);
    setMessage(null);

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      return;
    }

    setMessage("Signed out.");
  }

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            {copy.title}
          </h1>
          <p className="text-sm text-slate-600">{copy.description}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Password
              <input
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-sky-500"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {isSubmitting ? "Working..." : copy.buttonLabel}
            </button>
          </form>

          <p className="mt-4 text-sm text-slate-600">
            <Link href={copy.alternateHref} className="text-sky-700 underline">
              {copy.alternateLabel}
            </Link>
          </p>

          {message ? (
            <p className="mt-4 text-sm text-emerald-700">{message}</p>
          ) : null}

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Current User
          </h2>
          <p className="mt-3 text-sm text-slate-700">
            {session?.user.email ?? "No active session"}
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </main>
  );
}
