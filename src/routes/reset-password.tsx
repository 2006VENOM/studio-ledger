import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset password — ONUR CO-OPPORATION" },
      { name: "description", content: "Set a new password for your ONUR CO-OPPORATION account." },
      { property: "og:title", content: "Reset password — ONUR CO-OPPORATION" },
      { property: "og:description", content: "Set a new password for your ONUR CO-OPPORATION account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"checking" | "ready" | "invalid" | "done">("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) {
      setStatus("ready");
    } else {
      setStatus("invalid");
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setStatus("done");
    window.setTimeout(() => navigate({ to: "/dashboard", replace: true }), 1500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">Account security</p>
          <h1 className="mt-2 font-display text-2xl uppercase">Set new password</h1>
        </div>

        <div className="border border-border bg-card p-6 shadow-command">
          {status === "checking" && (
            <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Checking reset link…
            </p>
          )}

          {status === "invalid" && (
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground">
                This reset link is missing or has expired. Request a new one from the sign-in page.
              </p>
              <Button className="mt-5 h-11 w-full font-display uppercase" onClick={() => navigate({ to: "/auth" })}>
                Back to sign in
              </Button>
            </div>
          )}

          {status === "ready" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block text-xs font-semibold uppercase text-muted-foreground">
                New password
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
                Confirm new password
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
                {busy ? <Loader2 className="animate-spin" /> : null} Update password
              </Button>
            </form>
          )}

          {status === "done" && (
            <p className="flex items-center gap-2 py-6 text-sm text-primary">
              <CheckCircle2 className="h-5 w-5" /> Password updated. Taking you to your dashboard…
            </p>
          )}

          {error && <p className="mt-4 border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  );
}
