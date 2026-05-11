// Simple linear regression for sales prediction.
// y = a + b*x  where x is days since first sale.

export interface SalePoint { sale_date: string; units_sold: number; revenue: number; }
export interface ForecastPoint { date: string; predicted_units: number; predicted_revenue: number; }
export interface ForecastResult {
  history: { date: string; units: number; revenue: number }[];
  forecast: ForecastPoint[];
  metrics: {
    slope: number; intercept: number;
    units: { r2: number; mae: number };
    revenue: { r2: number; mae: number };
  };
}

const dayMs = 86_400_000;

export function forecastSales(sales: SalePoint[], horizonDays: number): ForecastResult {
  if (sales.length < 2) {
    throw new Error("Need at least 2 sales records to train a model.");
  }
  const sorted = [...sales].sort((a, b) => a.sale_date.localeCompare(b.sale_date));
  const t0 = new Date(sorted[0].sale_date).getTime();

  const xs = sorted.map(s => (new Date(s.sale_date).getTime() - t0) / dayMs);
  const ys = sorted.map(s => s.units_sold);

  // Average revenue per unit (for revenue forecast)
  const totalUnits = ys.reduce((a, b) => a + b, 0) || 1;
  const totalRev = sorted.reduce((a, s) => a + Number(s.revenue), 0);
  const avgPrice = totalRev / totalUnits;

  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;

  // Units R² + MAE
  let ssResU = 0, ssTotU = 0, maeU = 0;
  for (let i = 0; i < n; i++) {
    const pred = intercept + slope * xs[i];
    ssResU += (ys[i] - pred) ** 2;
    ssTotU += (ys[i] - meanY) ** 2;
    maeU += Math.abs(ys[i] - pred);
  }
  const r2U = ssTotU === 0 ? 1 : 1 - ssResU / ssTotU;
  maeU = maeU / n;

  // Revenue R² + MAE (using predicted units * avgPrice vs actual revenue)
  const revs = sorted.map(s => Number(s.revenue));
  const meanRev = revs.reduce((a, b) => a + b, 0) / n;
  let ssResR = 0, ssTotR = 0, maeR = 0;
  for (let i = 0; i < n; i++) {
    const predRev = Math.max(0, intercept + slope * xs[i]) * avgPrice;
    ssResR += (revs[i] - predRev) ** 2;
    ssTotR += (revs[i] - meanRev) ** 2;
    maeR += Math.abs(revs[i] - predRev);
  }
  const r2R = ssTotR === 0 ? 1 : 1 - ssResR / ssTotR;
  maeR = maeR / n;

  const lastX = xs[xs.length - 1];
  const forecast: ForecastPoint[] = [];
  for (let i = 1; i <= horizonDays; i++) {
    const x = lastX + i;
    const yPred = Math.max(0, intercept + slope * x);
    forecast.push({
      date: new Date(t0 + x * dayMs).toISOString().slice(0, 10),
      predicted_units: Math.round(yPred * 100) / 100,
      predicted_revenue: Math.round(yPred * avgPrice * 100) / 100,
    });
  }

  return {
    history: sorted.map(s => ({ date: s.sale_date, units: s.units_sold, revenue: Number(s.revenue) })),
    forecast,
    metrics: {
      slope, intercept,
      units: { r2: r2U, mae: maeU },
      revenue: { r2: r2R, mae: maeR },
    },
  };
}
