import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
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

function AuthPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const email = `${username.trim().toLowerCase()}@onur.local`;
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError("Wrong username or password.");
      setBusy(false);
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="mb-8 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">Restricted access</p>
          <h1 className="mt-2 font-display text-2xl uppercase sm:text-3xl">ONUR CO-OPPORATION</h1>
          <p className="mt-3 text-sm text-muted-foreground">Enter your username and password.</p>
        </div>
        <div className="border border-border bg-card p-6 shadow-command">
          <form onSubmit={handleSignIn} className="space-y-4">
            <label className="block text-xs font-semibold uppercase text-muted-foreground">
              Username
              <input className="tech-input mt-1" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="characters" required />
            </label>
            <label className="block text-xs font-semibold uppercase text-muted-foreground">
              Password
              <input className="tech-input mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </label>
            <Button type="submit" className="h-12 w-full font-display uppercase" disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <LogIn />} Unlock
            </Button>
          </form>
          {error && <p className="mt-4 border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</p>}
        </div>
        <div className="mt-6 flex items-center justify-center gap-2 font-mono text-[10px] uppercase text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Authorized personnel only
        </div>
      </div>
      <footer className="border-t border-border py-4 text-center font-mono text-[9px] uppercase text-muted-foreground">
        ONUR SALES SYSTEM // CLOUD SECURED
      </footer>
    </div>
  );
}
