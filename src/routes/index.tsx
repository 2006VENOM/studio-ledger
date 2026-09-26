import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Download, Plus, Trash2, Scissors } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Studio Ledger — Daily Activity Tracker" },
      { name: "description", content: "Track sales, material purchases and expenses for your apparel studio. Export reports to Word." },
      { property: "og:title", content: "Studio Ledger — Daily Activity Tracker" },
      { property: "og:description", content: "Track sales, materials and expenses for your fashion studio in Naira." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const CATEGORIES = ["Sales", "Material Purchased", "Graphics Purchased", "Accessories", "Transportation"] as const;
type Category = (typeof CATEGORIES)[number];
type Entry = { id: string; category: Category; date: string; description: string; qty: number; price: number };

const CATALOG: Record<string, number> = {
  "Black material": 2300,
  "Forest material": 2300,
  "White Flex": 1800,
  "Joggers rope": 100,
  "Rim black": 3000,
};
const STORAGE = "studio-ledger-entries";
const today = () => new Date().toISOString().slice(0, 10);
const naira = (n: number) => "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function Index() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [category, setCategory] = useState<Category>("Sales");
  const [date, setDate] = useState(today());
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");

  useEffect(() => {
    try { setEntries(JSON.parse(localStorage.getItem(STORAGE) || "[]")); } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(STORAGE, JSON.stringify(entries)); }, [entries, loaded]);

  const onDesc = (v: string) => {
    setDescription(v);
    const hit = Object.keys(CATALOG).find((k) => k.toLowerCase() === v.trim().toLowerCase());
    if (hit) setPrice(String(CATALOG[hit]));
  };

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const q = parseFloat(qty), p = parseFloat(price);
    if (!description.trim() || !(q > 0) || isNaN(p)) return;
    setEntries((xs) => [...xs, { id: crypto.randomUUID(), category, date, description: description.trim(), qty: q, price: p }]);
    setDescription(""); setPrice(""); setQty("1");
  };

  const grouped = useMemo(() => CATEGORIES.map((c) => {
    const rows = entries.filter((e) => e.category === c).sort((a, b) => b.date.localeCompare(a.date));
    return { c, rows, subtotal: rows.reduce((s, r) => s + r.qty * r.price, 0) };
  }), [entries]);
  const grand = grouped.reduce((s, g) => s + g.subtotal, 0);

  const clearAll = () => { if (confirm("Delete ALL records? This cannot be undone.")) setEntries([]); };

  const exportDoc = () => {
    const th = 'style="border:1px solid #333;padding:6px;background:#1e293b;color:#fff;text-align:left"';
    const td = 'style="border:1px solid #333;padding:6px"';
    const tdr = 'style="border:1px solid #333;padding:6px;text-align:right"';
    const sections = grouped.filter((g) => g.rows.length).map((g) => `
      <h2 style="font-family:Arial;color:#0f172a;margin-top:24px">${g.c}</h2>
      <table style="border-collapse:collapse;width:100%;font-family:Arial;font-size:11pt">
        <tr><th ${th}>Date</th><th ${th}>Description</th><th ${th}>Qty/Yards</th><th ${th}>Unit Price (₦)</th><th ${th}>Total (₦)</th></tr>
        ${g.rows.map((r) => `<tr><td ${td}>${r.date}</td><td ${td}>${esc(r.description)}</td><td ${tdr}>${r.qty}</td><td ${tdr}>${naira(r.price)}</td><td ${tdr}>${naira(r.qty * r.price)}</td></tr>`).join("")}
        <tr><td colspan="4" ${tdr}><b>Subtotal</b></td><td ${tdr}><b>${naira(g.subtotal)}</b></td></tr>
      </table>`).join("");
    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>Report</title></head><body>
      <h1 style="font-family:Arial;color:#0f172a;border-bottom:3px solid #16a34a;padding-bottom:6px">Studio Activity Report</h1>
      <p style="font-family:Arial;color:#555">Generated: ${new Date().toLocaleString("en-NG")}</p>
      ${sections || "<p>No records.</p>"}
      <div style="margin-top:28px;padding:12px;border:2px solid #16a34a;font-family:Arial;font-size:14pt"><b>GRAND TOTAL: ${naira(grand)}</b></div>
      </body></html>`;
    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `studio-report-${today()}.doc`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const input = "h-12 w-full rounded-lg border border-border bg-background px-3 text-base text-foreground outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-[960px] items-center justify-between gap-3 px-4 py-5">
          <div className="flex items-center gap-2">
            <Scissors className="h-6 w-6" />
            <div>
              <h1 className="text-lg font-bold tracking-tight">Studio Ledger</h1>
              <p className="text-xs opacity-70">Daily activity · purchases · sales</p>
            </div>
          </div>
          <button onClick={exportDoc} className="inline-flex h-11 items-center gap-2 rounded-lg bg-success px-4 text-sm font-semibold text-success-foreground hover:opacity-90">
            <Download className="h-4 w-4" /> <span className="hidden sm:inline">Export Report to</span> .DOC
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[960px] space-y-6 px-4 py-6">
        <form onSubmit={add} className="grid gap-4 rounded-xl border border-border bg-card p-4 shadow-sm sm:grid-cols-2 sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground sm:col-span-2">New Entry</h2>
          <label className="space-y-1 text-sm font-medium">Category
            <select className={input} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium">Date
            <input type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label className="space-y-1 text-sm font-medium sm:col-span-2">Item description
            <input list="catalog" className={input} value={description} onChange={(e) => onDesc(e.target.value)} placeholder="e.g. Black material" required />
            <datalist id="catalog">
              {Object.entries(CATALOG).map(([k, v]) => <option key={k} value={k}>{naira(v)}</option>)}
            </datalist>
          </label>
          <label className="space-y-1 text-sm font-medium">Quantity / Yards
            <input type="number" inputMode="decimal" step="any" min="0" className={input} value={qty} onChange={(e) => setQty(e.target.value)} required />
          </label>
          <label className="space-y-1 text-sm font-medium">Unit Price (₦)
            <input type="number" inputMode="decimal" step="any" min="0" className={input} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" required />
          </label>
          <div className="flex items-center justify-between gap-3 sm:col-span-2">
            <span className="text-sm text-muted-foreground">Total: <b className="text-foreground">{naira((parseFloat(qty) || 0) * (parseFloat(price) || 0))}</b></span>
            <button className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-6 font-semibold text-primary-foreground hover:opacity-90">
              <Plus className="h-5 w-5" /> Add Record
            </button>
          </div>
        </form>

        {grouped.map((g) => (
          <section key={g.c} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="font-semibold">{g.c}</h3>
              <span className="text-xs text-muted-foreground">{g.rows.length} record{g.rows.length !== 1 && "s"}</span>
            </div>
            {g.rows.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">No records yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="bg-muted text-left text-xs uppercase text-muted-foreground">
                    <tr><th className="px-4 py-2">Date</th><th className="px-4 py-2">Description</th><th className="px-4 py-2 text-right">Qty/Yards</th><th className="px-4 py-2 text-right">Unit (₦)</th><th className="px-4 py-2 text-right">Total (₦)</th><th className="px-2 py-2" /></tr>
                  </thead>
                  <tbody>
                    {g.rows.map((r) => (
                      <tr key={r.id} className="border-t border-border">
                        <td className="whitespace-nowrap px-4 py-2">{r.date}</td>
                        <td className="px-4 py-2">{r.description}</td>
                        <td className="px-4 py-2 text-right">{r.qty}</td>
                        <td className="px-4 py-2 text-right">{naira(r.price)}</td>
                        <td className="px-4 py-2 text-right font-medium">{naira(r.qty * r.price)}</td>
                        <td className="px-2 py-2 text-right">
                          <button aria-label="Delete" onClick={() => setEntries((xs) => xs.filter((x) => x.id !== r.id))} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="border-t-2 border-border bg-muted font-semibold"><td colSpan={4} className="px-4 py-2 text-right">Subtotal</td><td className="px-4 py-2 text-right">{naira(g.subtotal)}</td><td /></tr></tfoot>
                </table>
              </div>
            )}
          </section>
        ))}

        <div className="flex flex-col gap-4 rounded-xl bg-primary p-6 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-70">Grand Total — all categories</p>
            <p className="text-3xl font-bold text-success">{naira(grand)}</p>
          </div>
          <button onClick={clearAll} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-primary-foreground/30 px-4 text-sm hover:bg-destructive hover:border-destructive">
            <Trash2 className="h-4 w-4" /> Clear All Records
          </button>
        </div>
      </main>
    </div>
  );
}
