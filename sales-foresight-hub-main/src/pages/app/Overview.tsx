import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, LineChart as LineIcon, Receipt, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";

interface Stats { products: number; sales: number; revenue: number; predictions: number; }
type SaleRevenue = Pick<Tables<"sales">, "revenue">;

const Overview = () => {
  const [stats, setStats] = useState<Stats>({ products: 0, sales: 0, revenue: 0, predictions: 0 });

  useEffect(() => {
    (async () => {
      const [{ count: p }, { data: s }, { count: pr }] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("sales").select("revenue, units_sold"),
        supabase.from("predictions").select("*", { count: "exact", head: true }),
      ]);
      const revenue = ((s ?? []) as SaleRevenue[]).reduce((a, r) => a + Number(r.revenue), 0);
      setStats({ products: p ?? 0, sales: s?.length ?? 0, revenue, predictions: pr ?? 0 });
    })();
  }, []);

  const cards = [
    { label: "Products", value: stats.products, icon: Package },
    { label: "Sales records", value: stats.sales, icon: Receipt },
    { label: "Total revenue", value: `$${stats.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: TrendingUp },
    { label: "Forecasts run", value: stats.predictions, icon: LineIcon },
  ];

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-2">Workspace</p>
          <h1 className="text-4xl font-semibold tracking-tight">Overview</h1>
        </div>
        <Link to="/app/predict"><Button>Run a forecast</Button></Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {cards.map(c => (
          <div key={c.label} className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">{c.label}</span>
              <c.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-3xl font-semibold tracking-tight">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-8">
        <h2 className="text-xl font-semibold mb-2">Get started in three steps</h2>
        <ol className="space-y-3 text-muted-foreground">
          <li><span className="text-primary font-mono mr-2">01</span> Add a product in <Link to="/app/products" className="underline">Products</Link>.</li>
          <li><span className="text-primary font-mono mr-2">02</span> Log historical daily sales for that product.</li>
          <li><span className="text-primary font-mono mr-2">03</span> Open <Link to="/app/predict" className="underline">Predict</Link> to generate a forecast.</li>
        </ol>
      </div>
    </div>
  );
};
export default Overview;
