import { useEffect, useState } from "react";
import { Plus, Trash2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import SalesPanel from "./SalesPanel";

type Product = Pick<Tables<"products">, "id" | "name" | "sku" | "category" | "unit_price">;

const Products = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", sku: "", category: "", unit_price: "" });

  const load = async () => {
    const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message); else setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("products").insert({
      user_id: user.id,
      name: form.name, sku: form.sku || null, category: form.category || null,
      unit_price: Number(form.unit_price) || 0,
    });
    if (error) return toast.error(error.message);
    setForm({ name: "", sku: "", category: "", unit_price: "" });
    setOpen(false); load(); toast.success("Product added");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    if (active?.id === id) setActive(null);
    load();
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">Catalog</p>
          <h1 className="text-4xl font-semibold tracking-tight">Products</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New product</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add product</DialogTitle></DialogHeader>
            <form onSubmit={add} className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>SKU</Label><Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></div>
                <div><Label>Category</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
              </div>
              <div><Label>Unit price ($)</Label><Input type="number" step="0.01" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: e.target.value })} /></div>
              <Button type="submit" className="w-full">Save</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card divide-y divide-border">
          {items.length === 0 && (
            <div className="p-12 text-center text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-3 opacity-40" />
              No products yet.
            </div>
          )}
          {items.map(p => (
            <button key={p.id} onClick={() => setActive(p)}
              className={`w-full text-left p-5 flex items-center justify-between hover:bg-secondary/50 transition-colors ${active?.id === p.id ? "bg-secondary/60" : ""}`}>
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {p.sku || "—"} · {p.category || "uncategorized"} · ${Number(p.unit_price).toFixed(2)}
                </p>
              </div>
              <span onClick={(e) => { e.stopPropagation(); remove(p.id); }}
                className="text-muted-foreground hover:text-destructive p-2 rounded-md cursor-pointer">
                <Trash2 className="h-4 w-4" />
              </span>
            </button>
          ))}
        </div>

        <div>
          {active ? <SalesPanel product={active} /> : (
            <div className="glass-card p-12 text-center text-muted-foreground">
              Select a product to log sales.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Products;
