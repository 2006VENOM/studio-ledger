import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";

import beanieImage from "@/assets/beanie.jpg";
import skullCapImage from "@/assets/skull-cap.jpg";
import skiMaskImage from "@/assets/ski-mask.jpg";
import tshirtImage from "@/assets/tshirt.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ONUR CO-OPPORATION — Sales Command" },
      { name: "description", content: "Sign in to record daily apparel sales and studio expenses for ONUR CO-OPPORATION." },
      { property: "og:title", content: "ONUR CO-OPPORATION — Sales Command" },
      { property: "og:description", content: "A sales-first command dashboard for ONUR CO-OPPORATION." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Landing,
});

const PRODUCTS = [
  { name: "Beanie", price: 2000, image: beanieImage },
  { name: "Skull Cap", price: 1000, image: skullCapImage },
  { name: "Ski Mask", price: 2000, image: skiMaskImage },
  { name: "Guy Top / T-Shirt", price: 5000, image: tshirtImage },
  { name: "Double-Sided Beanie", price: 2500, image: beanieImage },
];

function Landing() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-10 sm:py-16">
        <header className="flex items-center justify-between">
          <span className="font-display text-sm tracking-widest">ONUR CO-OPPORATION</span>
          <Button asChild variant="outline" size="sm">
            <Link to="/auth">Sign in</Link>
          </Button>
        </header>

        <section className="space-y-6">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
            <ShieldCheck className="h-4 w-4" /> Secure sales command
          </p>
          <h1 className="font-display text-4xl leading-tight sm:text-6xl">
            Every sale.<br />Every naira.<br />Locked in.
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Record sales in seconds, track studio expenses, and export reports — saved safely to your account and
            available on any device.
          </p>
          <Button asChild size="lg" className="h-12 px-6">
            <Link to="/auth">
              Open dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {PRODUCTS.map((p) => (
            <div key={p.name} className="border border-border bg-card">
              <img src={p.image} alt={p.name} className="aspect-square w-full object-cover" loading="lazy" />
              <div className="p-3">
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="font-mono text-xs text-primary">₦{p.price.toLocaleString("en-NG")}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
