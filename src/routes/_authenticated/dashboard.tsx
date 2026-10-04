import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  CalendarDays,
  Download,
  LogOut,
  Menu,
  Minus,
  PackageCheck,
  Plus,
  ReceiptText,
  ShoppingBag,
  Trash2,
  TrendingUp,
} from "lucide-react";

import beanieImage from "@/assets/beanie.jpg";
import skullCapImage from "@/assets/skull-cap.jpg";
import skiMaskImage from "@/assets/ski-mask.jpg";
import tshirtImage from "@/assets/tshirt.jpg";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "ONUR CO-OPPORATION — Sales Command" },
      { name: "description", content: "Record daily apparel sales and studio expenses for ONUR CO-OPPORATION." },
      { property: "og:title", content: "ONUR CO-OPPORATION — Sales Command" },
      { property: "og:description", content: "A sales-first command dashboard for ONUR CO-OPPORATION." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

const PRODUCTS = [
  { name: "Beanie", price: 2000, code: "ONR-BN-01", image: beanieImage },
  { name: "Skull Cap", price: 1000, code: "ONR-SC-02", image: skullCapImage },
  { name: "Ski Mask", price: 2000, code: "ONR-SM-03", image: skiMaskImage },
  { name: "Guy Top / T-Shirt", price: 5000, code: "ONR-TS-04", image: tshirtImage },
  { name: "Double-Sided Beanie", price: 2500, code: "ONR-DB-05", image: beanieImage },
] as const;

const EXPENSE_CATEGORIES = ["Material Purchased", "Graphics Purchased", "Accessories", "Transportation"] as const;
type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
type Category = "Sales" | ExpenseCategory;

type EntryRow = {
  id: string;
  user_id: string;
  category: string;
  entry_date: string;
  description: string;
  qty: number;
  unit_price: number;
  created_at: string;
};

type LocalEntry = { id: string; category: Category; date: string; description: string; qty: number; price: number };

const STORAGE = "studio-ledger-entries";
const NIL_UUID = "00000000-0000-0000-0000-000000000000";
const today = () => new Date().toISOString().slice(0, 10);
const naira = (value: number) => `₦${value.toLocaleString("en-NG")}`;
const safeText = (value: string) => value.replace(/[&<>\"]/g, (character) => {
  const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
  return entities[character] ?? character;
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [saleDate, setSaleDate] = useState(today());
  const [notice, setNotice] = useState("");
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>("Material Purchased");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expensePrice, setExpensePrice] = useState("");
  const [expenseQty, setExpenseQty] = useState("1");
  const [expenseDate, setExpenseDate] = useState(today());
  const [busy, setBusy] = useState(false);

  const entriesQuery = useQuery({
    queryKey: ["entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("id,user_id,category,entry_date,description,qty,unit_price,created_at")
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as EntryRow[];
    },
  });

  const entries = useMemo(() => entriesQuery.data ?? [], [entriesQuery.data]);

  // One-time move of records saved on this device into the cloud account.
  const migrating = useRef(false);
  useEffect(() => {
    if (migrating.current || !user) return;
    migrating.current = true;
    const saved = localStorage.getItem(STORAGE);
    if (!saved) return;
    try {
      const rows = JSON.parse(saved) as LocalEntry[];
      if (Array.isArray(rows) && rows.length > 0) {
        const payload = rows.map((row) => ({
          id: row.id,
          user_id: user.id,
          category: row.category,
          entry_date: row.date,
          description: row.description,
          qty: row.qty,
          unit_price: row.price,
        }));
        supabase
          .from("entries")
          .upsert(payload, { onConflict: "id" })
          .then(({ error: upsertError }) => {
            if (!upsertError) localStorage.removeItem(STORAGE);
            queryClient.invalidateQueries({ queryKey: ["entries"] });
          });
      } else {
        localStorage.removeItem(STORAGE);
      }
    } catch {
      localStorage.removeItem(STORAGE);
    }
  }, [user, queryClient]);

  const sales = useMemo(() => entries.filter((entry) => entry.category === "Sales"), [entries]);
  const expenses = useMemo(() => entries.filter((entry) => entry.category !== "Sales"), [entries]);
  const todaysSales = sales.filter((entry) => entry.entry_date === today());
  const todayRevenue = todaysSales.reduce((sum, entry) => sum + entry.qty * entry.unit_price, 0);
  const todayUnits = todaysSales.reduce((sum, entry) => sum + entry.qty, 0);
  const allSales = sales.reduce((sum, entry) => sum + entry.qty * entry.unit_price, 0);
  const allExpenses = expenses.reduce((sum, entry) => sum + entry.qty * entry.unit_price, 0);
  const activeProduct = PRODUCTS[selectedProduct] ?? PRODUCTS[0];

  const productPerformance = PRODUCTS.map((product) => ({
    ...product,
    units: sales
      .filter((entry) => entry.description === product.name)
      .reduce((sum, entry) => sum + entry.qty, 0),
  }));
  const maxUnits = Math.max(...productPerformance.map((product) => product.units), 1);

  const flash = (text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 2400);
  };

  const recordSale = async () => {
    if (!user || busy) return;
    setBusy(true);
    const { error } = await supabase.from("entries").insert({
      id: crypto.randomUUID(),
      user_id: user.id,
      category: "Sales",
      entry_date: saleDate,
      description: activeProduct.name,
      qty: quantity,
      unit_price: activeProduct.price,
    });
    setBusy(false);
    if (error) {
      flash("Could not record sale");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["entries"] });
    flash(`${quantity} × ${activeProduct.name} recorded`);
    setQuantity(1);
  };

  const addExpense = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const parsedPrice = Number(expensePrice);
    const parsedQty = Number(expenseQty);
    if (!expenseDescription.trim() || parsedPrice < 0 || parsedQty <= 0) return;
    const { error } = await supabase.from("entries").insert({
      id: crypto.randomUUID(),
      user_id: user.id,
      category: expenseCategory,
      entry_date: expenseDate,
      description: expenseDescription.trim(),
      qty: parsedQty,
      unit_price: parsedPrice,
    });
    if (error) return;
    queryClient.invalidateQueries({ queryKey: ["entries"] });
    setExpenseDescription("");
    setExpensePrice("");
    setExpenseQty("1");
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("entries").delete().eq("id", id);
    if (error) return;
    queryClient.invalidateQueries({ queryKey: ["entries"] });
  };

  const clearAllRecords = async () => {
    if (!window.confirm("Delete ALL sales and expense records? This cannot be undone.")) return;
    const { error } = await supabase.from("entries").delete().neq("id", NIL_UUID);
    if (error) return;
    queryClient.invalidateQueries({ queryKey: ["entries"] });
  };

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const exportDoc = () => {
    const rows = entries
      .slice()
      .sort((a, b) => b.entry_date.localeCompare(a.entry_date))
      .map((entry) => `<tr><td>${entry.entry_date}</td><td>${safeText(entry.category)}</td><td>${safeText(entry.description)}</td><td>${entry.qty}</td><td>${naira(entry.unit_price)}</td><td>${naira(entry.qty * entry.unit_price)}</td></tr>`)
      .join("");
    const html = `<html><head><meta charset="utf-8"><style>body{font-family:Arial;color:#0b1220}h1{border-bottom:4px solid #2dd4a8;padding-bottom:10px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #64748b;padding:8px;text-align:left}th{background:#1e293b;color:#f8fafc}.total{margin-top:24px;border:2px solid #2dd4a8;padding:14px;font-size:18px}</style></head><body><h1>ONUR CO-OPPORATION REPORT</h1><p>Generated ${new Date().toLocaleString("en-NG")}</p><table><tr><th>Date</th><th>Category</th><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>${rows || "<tr><td colspan='6'>No records yet.</td></tr>"}</table><div class="total"><b>Sales: ${naira(allSales)} &nbsp; Expenses: ${naira(allExpenses)} &nbsp; Balance: ${naira(allSales - allExpenses)}</b></div></body></html>`;
    const blob = new Blob(["\ufeff", html], { type: "application/msword" });
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = `onur-report-${today()}.doc`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 border-b border-border pb-5">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">Sales operational core</p>
            <h1 className="mt-1 truncate font-display text-xl uppercase sm:text-3xl">ONUR CO-OPPORATION</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={exportDoc} aria-label="Export report" title="Export report">
              <Download />
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open records menu" title="Records menu"><Menu /></Button>
              </SheetTrigger>
              <SheetContent className="w-full overflow-y-auto border-l-border bg-background sm:max-w-lg">
                <SheetHeader className="border-b border-border pb-5 text-left">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">Operations menu</p>
                  <SheetTitle className="font-display text-xl uppercase">Other records</SheetTitle>
                  <SheetDescription>Purchases and studio expenses stay here, away from your sales screen.</SheetDescription>
                </SheetHeader>

                <form onSubmit={addExpense} className="mt-6 space-y-4 border border-border bg-card p-4">
                  <p className="font-mono text-xs uppercase text-muted-foreground">Add expense record</p>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground">Category
                    <select className="tech-input mt-1" value={expenseCategory} onChange={(event) => setExpenseCategory(event.target.value as ExpenseCategory)}>
                      {EXPENSE_CATEGORIES.map((category) => <option key={category}>{category}</option>)}
                    </select>
                  </label>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground">Description
                    <input className="tech-input mt-1" value={expenseDescription} onChange={(event) => setExpenseDescription(event.target.value)} placeholder="What did you buy?" required />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-semibold uppercase text-muted-foreground">Quantity
                      <input className="tech-input mt-1" type="number" min="0.01" step="any" value={expenseQty} onChange={(event) => setExpenseQty(event.target.value)} required />
                    </label>
                    <label className="block text-xs font-semibold uppercase text-muted-foreground">Unit price
                      <input className="tech-input mt-1" type="number" min="0" value={expensePrice} onChange={(event) => setExpensePrice(event.target.value)} placeholder="₦0" required />
                    </label>
                  </div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground">Date
                    <input className="tech-input mt-1" type="date" value={expenseDate} onChange={(event) => setExpenseDate(event.target.value)} required />
                  </label>
                  <Button className="h-11 w-full font-display uppercase" type="submit"><Plus /> Add expense</Button>
                </form>

                <div className="mt-7">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-mono text-xs uppercase text-muted-foreground">Expense log</p>
                    <p className="font-mono text-xs text-destructive">{naira(allExpenses)}</p>
                  </div>
                  <div className="space-y-2">
                    {expenses.length === 0 && <p className="border border-dashed border-border p-5 text-center text-sm text-muted-foreground">No expense records yet.</p>}
                    {expenses.slice().reverse().map((entry) => (
                      <div key={entry.id} className="flex items-center gap-3 border border-border bg-card p-3">
                        <ReceiptText className="h-4 w-4 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{entry.description}</p>
                          <p className="text-[10px] uppercase text-muted-foreground">{entry.category} · {entry.entry_date}</p>
                        </div>
                        <span className="font-mono text-xs">{naira(entry.qty * entry.unit_price)}</span>
                        <Button variant="ghost" size="icon" onClick={() => deleteEntry(entry.id)} aria-label={`Delete ${entry.description}`}><Trash2 /></Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 border border-destructive/40 bg-destructive/5 p-4">
                  <p className="font-mono text-xs uppercase text-muted-foreground">Danger zone</p>
                  <Button variant="destructive" className="mt-3 h-11 w-full font-display uppercase" onClick={clearAllRecords}>
                    <Trash2 /> Clear all records
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <Button variant="outline" size="icon" onClick={handleSignOut} aria-label="Sign out" title="Sign out">
              <LogOut />
            </Button>
          </div>
        </header>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] uppercase text-muted-foreground">
          <span className="inline-flex items-center gap-2"><span className="status-dot" /> {user.email ?? "Signed in"} · Cloud synced</span>
          <span className="inline-flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5" /> {new Date().toLocaleDateString("en-NG", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}</span>
        </div>

        <main className="mt-6 space-y-6">
          <section className="grid grid-cols-2 border border-border bg-card lg:grid-cols-4">
            <Metric icon={TrendingUp} code="001" label="Sales today" value={naira(todayRevenue)} accent />
            <Metric icon={PackageCheck} code="002" label="Units today" value={String(todayUnits)} />
            <Metric icon={Activity} code="003" label="Transactions" value={String(todaysSales.length)} />
            <Metric icon={ShoppingBag} code="004" label="All-time sales" value={naira(allSales)} />
          </section>

          <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.7fr)]">
            <div className="border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Quick checkout</p>
                  <h2 className="font-display text-lg uppercase">Select an item</h2>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">05 ACTIVE ITEMS</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {PRODUCTS.map((product, index) => (
                  <button
                    key={product.name}
                    type="button"
                    onClick={() => setSelectedProduct(index)}
                    className={`group relative min-w-0 border-b border-r border-border p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${selectedProduct === index ? "bg-accent" : "bg-card hover:bg-muted"}`}
                    aria-pressed={selectedProduct === index}
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <img src={product.image} alt={product.name} width={816} height={816} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      <span className="absolute left-2 top-2 bg-background/85 px-1.5 py-1 font-mono text-[8px] text-muted-foreground">{product.code}</span>
                      {selectedProduct === index && <span className="absolute bottom-2 right-2 bg-primary p-1 text-primary-foreground"><PackageCheck className="h-3.5 w-3.5" /></span>}
                    </div>
                    <p className="mt-3 min-h-10 text-sm font-semibold leading-tight">{product.name}</p>
                    <p className="mt-1 font-mono text-xs text-primary">{naira(product.price)}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="border border-primary bg-card p-5 shadow-command">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Current order</p>
              <h2 className="mt-2 font-display text-2xl uppercase">{activeProduct.name}</h2>
              <p className="mt-1 font-mono text-sm text-muted-foreground">{activeProduct.code} / {naira(activeProduct.price)} each</p>

              <div className="mt-8 flex items-center justify-between border-y border-border py-4">
                <span className="text-xs font-semibold uppercase text-muted-foreground">Quantity</span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><Minus /></Button>
                  <span className="w-10 text-center font-mono text-xl">{quantity}</span>
                  <Button variant="outline" size="icon" onClick={() => setQuantity((value) => value + 1)} aria-label="Increase quantity"><Plus /></Button>
                </div>
              </div>
              <label className="mt-4 block text-xs font-semibold uppercase text-muted-foreground">Sale date
                <input className="tech-input mt-1" type="date" value={saleDate} onChange={(event) => setSaleDate(event.target.value)} />
              </label>
              <div className="mt-6 flex items-end justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">Order total</p>
                  <p className="font-mono text-3xl font-bold text-primary">{naira(activeProduct.price * quantity)}</p>
                </div>
              </div>
              <Button className="mt-5 h-12 w-full font-display uppercase" onClick={recordSale} disabled={busy}>
                <ShoppingBag /> {busy ? "Recording…" : "Record sale"}
              </Button>
              <p className={`mt-3 min-h-5 text-center font-mono text-[10px] uppercase text-primary transition-opacity ${notice ? "opacity-100" : "opacity-0"}`} aria-live="polite">{notice || "Sale recorded"}</p>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
            <div className="border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
                <h2 className="font-display text-base uppercase">Recent sales</h2>
                <span className="font-mono text-[10px] text-muted-foreground">LIVE LEDGER</span>
              </div>
              {sales.length === 0 ? (
                <div className="flex min-h-44 flex-col items-center justify-center p-6 text-center">
                  <ShoppingBag className="mb-3 h-6 w-6 text-primary" />
                  <p className="font-display text-sm uppercase">Ready for first sale</p>
                  <p className="mt-1 text-xs text-muted-foreground">Choose a product above and record the order.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[590px] text-left">
                    <thead className="font-mono text-[9px] uppercase text-muted-foreground"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Item</th><th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3 text-right">Total</th><th className="w-12" /></tr></thead>
                    <tbody>
                      {sales.slice(0, 8).map((entry) => (
                        <tr key={entry.id} className="border-t border-border text-sm">
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{entry.entry_date}</td>
                          <td className="px-4 py-3 font-semibold">{entry.description}</td>
                          <td className="px-4 py-3 text-right font-mono">{entry.qty}</td>
                          <td className="px-4 py-3 text-right font-mono text-primary">{naira(entry.qty * entry.unit_price)}</td>
                          <td><Button variant="ghost" size="icon" onClick={() => deleteEntry(entry.id)} aria-label={`Delete ${entry.description}`}><Trash2 /></Button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="border border-border bg-card p-5">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-base uppercase">Product movement</h2>
                <Activity className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-5">
                {productPerformance.map((product) => (
                  <div key={product.name}>
                    <div className="mb-2 flex items-end justify-between gap-3">
                      <span className="text-xs font-semibold uppercase">{product.name}</span>
                      <span className="font-mono text-[10px] text-primary">{product.units} SOLD</span>
                    </div>
                    <div className="h-1.5 bg-muted"><div className="h-full bg-primary transition-all duration-500" style={{ width: `${(product.units / maxUnits) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-8 flex flex-col gap-3 border-t border-border py-5 font-mono text-[9px] uppercase text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>ONUR SALES SYSTEM / RECORDS SYNCED TO CLOUD</span>
          <span className="text-primary">OPERATIONAL // READY</span>
        </footer>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, code, label, value, accent = false }: { icon: typeof Activity; code: string; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`relative min-w-0 border-b border-r border-border p-4 sm:p-5 ${accent ? "metric-accent" : ""}`}>
      <span className="absolute right-3 top-3 font-mono text-[8px] text-muted-foreground">{code}</span>
      <Icon className="mb-5 h-4 w-4 text-primary" />
      <p className="font-mono text-[9px] uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-mono text-xl font-bold sm:text-2xl">{value}</p>
    </div>
  );
}
