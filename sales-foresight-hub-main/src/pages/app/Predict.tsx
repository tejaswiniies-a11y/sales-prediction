import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import type { Json, Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { forecastSales, type ForecastResult } from "@/lib/ml";

type Product = Pick<Tables<"products">, "id" | "name">;
type ForecastSale = Pick<Tables<"sales">, "sale_date" | "units_sold" | "revenue">;

const toJson = (value: unknown): Json => JSON.parse(JSON.stringify(value)) as Json;

const Predict = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState<string>("");
  const [horizon, setHorizon] = useState(30);
  const [result, setResult] = useState<ForecastResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("products").select("id,name").order("name").then(({ data }) => {
      setProducts(data ?? []);
      if (data?.[0]) setProductId(data[0].id);
    });
  }, []);

  const run = async () => {
    if (!productId || !user) return;
    setLoading(true); setResult(null);
    try {
      const { data, error } = await supabase.from("sales")
        .select("sale_date, units_sold, revenue")
        .eq("product_id", productId).order("sale_date");
      if (error) throw error;
      const out = forecastSales((data ?? []) as ForecastSale[], horizon);
      setResult(out);
      await supabase.from("predictions").insert({
        user_id: user.id, product_id: productId,
        horizon_days: horizon, model: "linear_regression",
        output: toJson(out),
      });
      toast.success("Forecast generated & saved");
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Unable to generate forecast"); }
    finally { setLoading(false); }
  };

  const unitsData = useMemo(() => {
    if (!result) return [];
    return [
      ...result.history.map(h => ({ date: h.date, actual: h.units, forecast: null as number | null })),
      ...result.forecast.map(f => ({ date: f.date, actual: null as number | null, forecast: f.predicted_units })),
    ];
  }, [result]);

  const revenueData = useMemo(() => {
    if (!result) return [];
    return [
      ...result.history.map(h => ({ date: h.date, actual: h.revenue, forecast: null as number | null })),
      ...result.forecast.map(f => ({ date: f.date, actual: null as number | null, forecast: f.predicted_revenue })),
    ];
  }, [result]);

  const presets = [7, 30, 90];

  return (
    <div className="p-8 max-w-6xl">
      <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">Inference</p>
      <h1 className="text-4xl font-semibold tracking-tight mb-8">Forecast</h1>

      <div className="glass-card p-6 mb-6 space-y-4">
        <div className="grid md:grid-cols-[1fr_auto] gap-4 items-end">
          <div>
            <Label>Product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={run} disabled={!productId || loading} size="lg">
            {loading ? "Training…" : "Run forecast"}
          </Button>
        </div>

        <div>
          <Label className="mb-2 block">Horizon</Label>
          <div className="flex flex-wrap gap-2 items-center">
            {presets.map(d => (
              <Button
                key={d}
                type="button"
                variant={horizon === d ? "default" : "outline"}
                size="sm"
                onClick={() => setHorizon(d)}
              >
                {d} days
              </Button>
            ))}
            <div className="flex items-center gap-2 ml-2">
              <span className="text-xs text-muted-foreground font-mono">CUSTOM</span>
              <Input
                type="number" min={1} max={365}
                value={horizon}
                onChange={e => setHorizon(Number(e.target.value))}
                className="w-24"
              />
            </div>
          </div>
        </div>
      </div>

      {result && (
        <>
          <div className="glass-card p-6 mb-6">
            <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
              <div>
                <p className="text-xs uppercase font-mono text-muted-foreground">Forecast summary</p>
                <h3 className="font-semibold text-lg">Linear regression · slope {result.metrics.slope.toFixed(3)} units/day</h3>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {result.history.length} obs → {result.forecast.length}d ahead
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { l: "Units · R²", v: result.metrics.units.r2.toFixed(3), hint: "Variance explained" },
                { l: "Units · MAE", v: result.metrics.units.mae.toFixed(2), hint: "Avg error (units)" },
                { l: "Revenue · R²", v: result.metrics.revenue.r2.toFixed(3), hint: "Variance explained" },
                { l: "Revenue · MAE", v: `$${result.metrics.revenue.mae.toFixed(2)}`, hint: "Avg error" },
              ].map(m => (
                <div key={m.l} className="rounded-lg border border-border bg-secondary/40 p-3">
                  <p className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider">{m.l}</p>
                  <p className="text-2xl font-semibold mt-1 tabular-nums">{m.v}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{m.hint}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-1">Units sold</h3>
              <p className="text-xs text-muted-foreground mb-4 font-mono">ACTUAL · FORECAST</p>
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={unitsData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                    <Legend />
                    <Line type="monotone" dataKey="actual" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} connectNulls />
                    <Line type="monotone" dataKey="forecast" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="font-semibold mb-1">Revenue ($)</h3>
              <p className="text-xs text-muted-foreground mb-4 font-mono">ACTUAL · FORECAST</p>
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={revenueData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                      formatter={(v: number | string | null) => v != null ? `$${Number(v).toFixed(2)}` : v}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="actual" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} connectNulls />
                    <Line type="monotone" dataKey="forecast" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default Predict;
