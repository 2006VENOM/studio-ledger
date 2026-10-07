import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Profit & loss — ONUR CO-OPPORATION" },
      { name: "description", content: "Charts of money sold, spent and profit or loss for ONUR CO-OPPORATION." },
      { property: "og:title", content: "Profit & loss — ONUR CO-OPPORATION" },
      { property: "og:description", content: "Daily sales, spending and profit or loss charts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReportsPage,
});

type Row = { category: string; entry_date: string; qty: number; unit_price: number };
const naira = (v: number) => `₦${Math.round(v).toLocaleString("en-NG")}`;
const COLORS = ["var(--primary)", "var(--destructive)", "#f59e0b", "#60a5fa", "#a78bfa"];
const RANGES = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "All time", days: 0 },
];

function ReportsPage() {
  const [days, setDays] = useState(30);
  const query = useQuery({
    queryKey: ["entries", "reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("category,entry_date,qty,unit_price")
        .is("deleted_at", null);
      if (error) throw error;
      return data as Row[];
    },
  });

  const { daily, byCategory, sold, spent } = useMemo(() => {
    const cutoff = days ? new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10) : "";
    const rows = (query.data ?? []).filter((r) => !cutoff || r.entry_date >= cutoff);
    const dayMap = new Map<string, { date: string; Sold: number; Spent: number }>();
    const catMap = new Map<string, number>();
    let sold = 0;
    let spent = 0;
    for (const r of rows) {
      const amount = Number(r.qty) * Number(r.unit_price);
      const d = dayMap.get(r.entry_date) ?? { date: r.entry_date, Sold: 0, Spent: 0 };
      if (r.category === "Sales") {
        d.Sold += amount;
        sold += amount;
      } else {
        d.Spent += amount;
        spent += amount;
        catMap.set(r.category, (catMap.get(r.category) ?? 0) + amount);
      }
      dayMap.set(r.entry_date, d);
    }
    const daily = [...dayMap.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({ ...d, Profit: d.Sold - d.Spent }));
    const byCategory = [...catMap.entries()].map(([name, value]) => ({ name, value }));
    return { daily, byCategory, sold, spent };
  }, [query.data, days]);

  const profit = sold - spent;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        <header className="flex items-center gap-3 border-b border-border pb-5">
          <Button asChild variant="outline" size="icon" aria-label="Back to dashboard">
            <Link to="/dashboard"><ArrowLeft /></Link>
          </Button>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">Chart board</p>
            <h1 className="font-display text-xl uppercase sm:text-2xl">Profit & loss</h1>
          </div>
        </header>

        <div className="mt-5 grid grid-cols-4 border border-border">
          {RANGES.map((r) => (
            <button key={r.label} type="button" onClick={() => setDays(r.days)}
              className={`h-10 font-mono text-[11px] uppercase ${days === r.days ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
              {r.label}
            </button>
          ))}
        </div>

        <section className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="Sold" value={naira(sold)} tone="text-primary" />
          <Stat label="Spent" value={naira(spent)} tone="text-destructive" />
          <Stat label={profit >= 0 ? "Profit" : "Loss"} value={naira(Math.abs(profit))} tone={profit >= 0 ? "text-primary" : "text-destructive"} />
        </section>

        {query.isLoading ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Loading…</p>
        ) : (
          <>
            <section className="mt-4 border border-border bg-card p-4">
              <h2 className="font-display text-sm uppercase">Money spent by type</h2>
              {byCategory.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No spending in this period.</p>
              ) : (
                <div className="mt-3 grid items-center gap-4 sm:grid-cols-2">
                  <div className="h-56">
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} stroke="none">
                          {byCategory.map((_, i) => <Cell key={i} fill={COLORS[(i + 1) % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => naira(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="space-y-2">
                    {byCategory.map((c, i) => (
                      <li key={c.name} className="flex items-center justify-between gap-3 border-b border-border pb-2 text-sm">
                        <span className="flex items-center gap-2"><span className="h-3 w-3" style={{ background: COLORS[(i + 1) % COLORS.length] }} />{c.name}</span>
                        <span className="font-mono">{naira(c.value)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section className="mt-4 border border-border bg-card p-4">
              <h2 className="font-display text-sm uppercase">Sold vs spent per day</h2>
              <div className="mt-3 h-64">
                <ResponsiveContainer>
                  <BarChart data={daily}>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} tickFormatter={(d: string) => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} width={50} tickFormatter={(v: number) => `${v / 1000}k`} />
                    <Tooltip formatter={(v: number) => naira(v)} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Sold" fill="var(--primary)" />
                    <Bar dataKey="Spent" fill="var(--destructive)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="mt-4 border border-border bg-card">
              <h2 className="border-b border-border p-4 font-display text-sm uppercase">Daily profit & loss</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="font-mono text-[10px] uppercase text-muted-foreground">
                    <tr><th className="px-4 py-2">Date</th><th className="px-4 py-2 text-right">Sold</th><th className="px-4 py-2 text-right">Spent</th><th className="px-4 py-2 text-right">Profit / loss</th></tr>
                  </thead>
                  <tbody>
                    {daily.length === 0 && <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No records in this period.</td></tr>}
                    {daily.slice().reverse().map((d) => (
                      <tr key={d.date} className="border-t border-border font-mono text-xs">
                        <td className="px-4 py-2 text-muted-foreground">{d.date}</td>
                        <td className="px-4 py-2 text-right text-primary">{naira(d.Sold)}</td>
                        <td className="px-4 py-2 text-right text-destructive">{naira(d.Spent)}</td>
                        <td className={`px-4 py-2 text-right ${d.Profit >= 0 ? "text-primary" : "text-destructive"}`}>{d.Profit >= 0 ? "+" : "−"}{naira(Math.abs(d.Profit))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="border border-border bg-card p-3">
      <p className="font-mono text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className={`mt-1 font-mono text-base font-bold sm:text-xl ${tone}`}>{value}</p>
    </div>
  );
}
