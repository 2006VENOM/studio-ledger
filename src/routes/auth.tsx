import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LogIn, Mail, ShieldCheck, UserPlus } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — ONUR CO-OPPORATION" },
      { name: "description", content: "Sign in to your ONUR CO-OPPORATION sales command dashboard." },
      { property: "og:title", content: "Sign in — ONUR CO-OPPORATION" },
      { property: "og:description", content: "Sign in to your ONUR CO-OPPORATION sales command dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setMessage("");
    setPassword("");
    setConfirm("");
  };

  const handleGoogle = async () => {
    setBusy(true);
    setError("");
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result && "error" in result && result.error) {
        setError("Google sign-in failed. Please try again.");
        setBusy(false);
        return;
      }
      if (result && "redirected" in result && result.redirected) return;
      navigate({ to: "/dashboard", replace: true });
    } catch {
      setError("Google sign-in failed. Please try again.");
      setBusy(false);
    }
  };

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setBusy(false);
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  };

  const handleSignUp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (data.session) {
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    setMessage("Account created. Check your email inbox and click the confirmation link to activate it.");
  };

  const handleForgot = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setMessage("Password reset link sent. Check your email inbox.");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="mb-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">Restricted access</p>
          <h1 className="mt-2 font-display text-2xl uppercase sm:text-3xl">ONUR CO-OPPORATION</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {mode === "forgot"
              ? "Enter your email and we'll send you a reset link."
              : "Sign in to reach your sales command dashboard."}
          </p>
        </div>

        <div className="border border-border bg-card p-6 shadow-command">
          {mode !== "forgot" && (
            <Button type="button" variant="outline" className="h-12 w-full" onClick={handleGoogle} disabled={busy}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <path fill="#EA4335" d="M12 5.04c1.62 0 3.06.56 4.2 1.64l3.12-3.12C17.46 1.8 14.96.72 12 .72 7.44.72 3.56 3.36 1.72 7.16l3.66 2.84C6.26 7.14 8.88 5.04 12 5.04z" />
                <path fill="#4285F4" d="M23.28 12.26c0-.8-.08-1.56-.2-2.26H12v4.52h6.34c-.28 1.48-1.1 2.74-2.34 3.58l3.62 2.8c2.12-1.96 3.66-4.84 3.66-8.64z" />
                <path fill="#FBBC05" d="M5.38 14.28a7.2 7.2 0 0 1 0-4.56L1.72 6.88a11.28 11.28 0 0 0 0 10.24l3.66-2.84z" />
                <path fill="#34A853" d="M12 23.28c3.04 0 5.6-1 7.46-2.72l-3.62-2.8c-1 .68-2.28 1.08-3.84 1.08-3.12 0-5.74-2.1-6.62-4.96l-3.66 2.84c1.84 3.8 5.72 6.56 10.28 6.56z" />
              </svg>
              Continue with Google
            </Button>
          )}

          {mode !== "forgot" && (
            <div className="my-5 flex items-center gap-3 font-mono text-[9px] uppercase text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or use email <span className="h-px flex-1 bg-border" />
            </div>
          )}

          {mode === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <label className="block text-xs font-semibold uppercase text-muted-foreground">
                Email
                <input
                  className="tech-input mt-1"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>
              <label className="block text-xs font-semibold uppercase text-muted-foreground">
                Password
                <input
                  className="tech-input mt-1"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </label>
              <Button type="submit" className="h-12 w-full font-display uppercase" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <LogIn />} Sign in
              </Button>
            </form>
          )}

          {mode === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <label className="block text-xs font-semibold uppercase text-muted-foreground">
                Email
                <input
                  className="tech-input mt-1"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>
              <label className="block text-xs font-semibold uppercase text-muted-foreground">
                Password
                <input
                  className="tech-input mt-1"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </label>
              <label className="block text-xs font-semibold uppercase text-muted-foreground">
                Confirm password
                <input
                  className="tech-input mt-1"
                  type="password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </label>
              <Button type="submit" className="h-12 w-full font-display uppercase" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <UserPlus />} Create account
              </Button>
            </form>
          )}

          {mode === "forgot" && (
            <form onSubmit={handleForgot} className="space-y-4">
              <label className="block text-xs font-semibold uppercase text-muted-foreground">
                Email
                <input
                  className="tech-input mt-1"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>
              <Button type="submit" className="h-12 w-full font-display uppercase" disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Mail />} Send reset link
              </Button>
            </form>
          )}

          {error && <p className="mt-4 border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}
          {message && <p className="mt-4 border border-primary/40 bg-primary/10 p-3 text-xs text-primary">{message}</p>}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 font-mono text-[10px] uppercase text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          {mode === "signin" ? (
            <>
              <button type="button" className="text-primary underline-offset-4 hover:underline" onClick={() => switchMode("signup")}>
                Create account
              </button>
              <span>·</span>
              <button type="button" className="underline-offset-4 hover:underline" onClick={() => switchMode("forgot")}>
                Forgot password?
              </button>
            </>
          ) : (
            <button type="button" className="text-primary underline-offset-4 hover:underline" onClick={() => switchMode("signin")}>
              Back to sign in
            </button>
          )}
        </div>
      </div>

      <footer className="border-t border-border py-4 text-center font-mono text-[9px] uppercase text-muted-foreground">
        ONUR SALES SYSTEM // CLOUD SECURED
      </footer>
    </div>
  );
}
