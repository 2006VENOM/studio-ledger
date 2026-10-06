import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, ImagePlus, Loader2, Paperclip, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/records")({
  head: () => ({
    meta: [
      { title: "All records — ONUR CO-OPPORATION" },
      { name: "description", content: "Search and filter every ONUR CO-OPPORATION sale and expense record." },
      { property: "og:title", content: "All records — ONUR CO-OPPORATION" },
      { property: "og:description", content: "Search and filter every sale and expense record." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecordsPage,
});

const CATEGORIES = ["Sales", "Material Purchased", "Graphics Purchased", "Accessories", "Transportation"];
const naira = (value: number) => `₦${value.toLocaleString("en-NG")}`;

type Row = {
  id: string;
  category: string;
  entry_date: string;
  description: string;
  qty: number;
  unit_price: number;
  created_at: string;
  receipt_path: string | null;
};

function RecordsPage() {
  const { user } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const query = useQuery({
    queryKey: ["entries", "records"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entries")
        .select("id,category,entry_date,description,qty,unit_price,created_at,receipt_path")
        .is("deleted_at", null)
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Row[];
    },
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (query.data ?? []).filter(
      (r) =>
        (category === "All" || r.category === category) &&
        (!from || r.entry_date >= from) &&
        (!to || r.entry_date <= to) &&
        (!term || r.description.toLowerCase().includes(term)),
    );
  }, [query.data, category, from, to, search]);
  const total = rows.reduce((sum, r) => sum + r.qty * r.unit_price, 0);

  const upload = async (row: Row, file: File) => {
    if (!file.type.startsWith("image/")) {
      setMessage("Please choose an image.");
      return;
    }
    setUploading(row.id);
    setMessage("");
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${row.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("receipts").upload(path, file);
    if (!error) {
      if (row.receipt_path) await supabase.storage.from("receipts").remove([row.receipt_path]);
      await supabase.from("entries").update({ receipt_path: path }).eq("id", row.id);
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      setMessage("Screenshot attached.");
    } else setMessage("Upload failed. Try again.");
    setUploading(null);
  };

  const view = async (path: string) => {
    const { data } = await supabase.storage.from("receipts").createSignedUrl(path, 600);
    if (data?.signedUrl) setPreview(data.signedUrl);
  };

  const removeReceipt = async (row: Row) => {
    if (!row.receipt_path || !window.confirm("Remove this screenshot?")) return;
    await supabase.storage.from("receipts").remove([row.receipt_path]);
    await supabase.from("entries").update({ receipt_path: null }).eq("id", row.id);
    queryClient.invalidateQueries({ queryKey: ["entries"] });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        <header className="flex items-center gap-3 border-b border-border pb-5">
          <Button asChild variant="outline" size="icon" aria-label="Back to dashboard">
            <Link to="/dashboard"><ArrowLeft /></Link>
          </Button>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary">Full ledger</p>
            <h1 className="font-display text-xl uppercase sm:text-2xl">All records</h1>
          </div>
        </header>

        <section className="mt-5 grid gap-3 border border-border bg-card p-4 sm:grid-cols-4">
          <label className="block text-xs font-semibold uppercase text-muted-foreground">Category
            <select className="tech-input mt-1" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>All</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase text-muted-foreground">From
            <input className="tech-input mt-1" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="block text-xs font-semibold uppercase text-muted-foreground">To
            <input className="tech-input mt-1" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <label className="block text-xs font-semibold uppercase text-muted-foreground">Search item
            <input className="tech-input mt-1" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. Beanie" />
          </label>
          <div className="flex items-center justify-between sm:col-span-4">
            <span className="font-mono text-xs text-muted-foreground">{rows.length} record(s) · <span className="text-primary">{naira(total)}</span></span>
            <button type="button" className="font-mono text-xs uppercase text-muted-foreground hover:text-foreground"
              onClick={() => { setCategory("All"); setFrom(""); setTo(""); setSearch(""); }}>Reset filters</button>
          </div>
        </section>

        {message && <p className="mt-3 font-mono text-xs text-primary">{message}</p>}

        <section className="mt-4 space-y-2">
          {query.isLoading && <p className="p-6 text-center text-sm text-muted-foreground">Loading…</p>}
          {!query.isLoading && rows.length === 0 && (
            <p className="border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No records match these filters.</p>
          )}
          {rows.map((r) => (
            <article key={r.id} className="flex flex-wrap items-center gap-3 border border-border bg-card p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{r.description}</p>
                <p className="text-[10px] uppercase text-muted-foreground">{r.category} · {r.entry_date}</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {r.qty} × {naira(r.unit_price)} = <span className={r.category === "Sales" ? "text-primary" : "text-destructive"}>{naira(r.qty * r.unit_price)}</span>
                </p>
                <p className="font-mono text-[10px] text-muted-foreground">Recorded {new Date(r.created_at).toLocaleString("en-NG")}</p>
              </div>
              <div className="flex items-center gap-1">
                {r.receipt_path && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => view(r.receipt_path!)}><Paperclip /> View</Button>
                    <Button variant="ghost" size="icon" onClick={() => removeReceipt(r)} aria-label="Remove screenshot"><X /></Button>
                  </>
                )}
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 border border-border px-3 text-xs font-semibold uppercase hover:bg-primary/10">
                  {uploading === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  {r.receipt_path ? "Replace" : "Add screenshot"}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading !== null}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(r, f); e.target.value = ""; }} />
                </label>
              </div>
            </article>
          ))}
        </section>
      </div>

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4" onClick={() => setPreview(null)}>
          <img src={preview} alt="Transaction screenshot" className="max-h-full max-w-full border border-border" />
          <Button variant="outline" size="icon" className="absolute right-4 top-4" aria-label="Close" onClick={() => setPreview(null)}><X /></Button>
        </div>
      )}
    </div>
  );
}
