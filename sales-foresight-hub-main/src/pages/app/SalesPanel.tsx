import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Sale = Pick<Tables<"sales">, "id" | "sale_date" | "units_sold" | "revenue">;
type Product = Pick<Tables<"products">, "id" | "name" | "unit_price">;

const SalesPanel = ({ product }: { product: Product }) => {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [form, setForm] = useState({ sale_date: new Date().toISOString().slice(0, 10), units_sold: "" });

  const load = useCallback(async () => {
    const { data, error } = await supabase.from("sales").select("*")
      .eq("product_id", product.id).order("sale_date", { ascending: false });
    if (error) toast.error(error.message); else setSales(data ?? []);
  }, [product.id]);
  useEffect(() => { load(); }, [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const units = Number(form.units_sold) || 0;
    const { error } = await supabase.from("sales").insert({
      user_id: user.id, product_id: product.id,
      sale_date: form.sale_date, units_sold: units,
      revenue: units * Number(product.unit_price),
    });
    if (error) return toast.error(error.message);
    setForm({ ...form, units_sold: "" }); load();
  };

  const remove = async (id: string) => {
    await supabase.from("sales").delete().eq("id", id);
    load();
  };

  const seed = async () => {
    if (!user) return;
    const today = new Date();
    const rows = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today); d.setDate(d.getDate() - (29 - i));
      const units = Math.max(1, Math.round(10 + i * 0.6 + (Math.random() - 0.5) * 6));
      return {
        user_id: user.id, product_id: product.id,
        sale_date: d.toISOString().slice(0, 10),
        units_sold: units, revenue: units * Number(product.unit_price),
      };
    });
    const { error } = await supabase.from("sales").insert(rows);
    if (error) toast.error(error.message); else { toast.success("30 days of sample sales added"); load(); }
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">Sales for</p>
          <h2 className="text-xl font-semibold">{product.name}</h2>
        </div>
        <Button variant="outline" size="sm" onClick={seed}>Seed 30 days</Button>
      </div>

      <form onSubmit={add} className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-5">
        <div><Label className="text-xs">Date</Label><Input type="date" value={form.sale_date} onChange={e => setForm({ ...form, sale_date: e.target.value })} /></div>
        <div><Label className="text-xs">Units</Label><Input type="number" min="0" value={form.units_sold} onChange={e => setForm({ ...form, units_sold: e.target.value })} required /></div>
        <Button type="submit" className="self-end"><Plus className="h-4 w-4" /></Button>
      </form>

      <div className="max-h-80 overflow-y-auto divide-y divide-border">
        {sales.length === 0 && <p className="text-sm text-muted-foreground py-4">No sales logged yet.</p>}
        {sales.map(s => (
          <div key={s.id} className="flex items-center justify-between py-2.5 text-sm">
            <span className="font-mono text-muted-foreground">{s.sale_date}</span>
            <span>{s.units_sold} units</span>
            <span className="font-mono">${Number(s.revenue).toFixed(2)}</span>
            <button onClick={() => remove(s.id)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
export default SalesPanel;
