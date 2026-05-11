import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Brain, Database, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Brain, title: "In-browser ML", body: "Linear regression trained client-side on your sales history. No data leaves the session unless you save it." },
  { icon: Database, title: "Lovable Cloud backend", body: "Postgres with row-level security stores your products, sales and predictions per user." },
  { icon: BarChart3, title: "Visual forecasts", body: "Interactive charts compare actual sales against the model's projected curve." },
  { icon: ShieldCheck, title: "Auth + roles", body: "Email/password sign-in with profiles and an admin role table out of the box." },
];

const Landing = () => (
  <div className="min-h-screen">
    <header className="container flex items-center justify-between py-6">
      <Link to="/" className="flex items-center gap-2">
        <span className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-primary-foreground" />
        </span>
        <span className="font-semibold tracking-tight">Forecast<span className="text-primary">/</span>OS</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
        <Link to="/auth?mode=signup"><Button size="sm">Get started</Button></Link>
      </div>
    </header>

    <section className="container relative pt-16 pb-24">
      <div className="absolute inset-0 grid-bg opacity-30 -z-10" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
        className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-mono text-muted-foreground mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
          v1.0 — retail sales prediction
        </span>
        <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter leading-[0.95] mb-6">
          Forecast tomorrow's <span className="text-gradient">sell-through</span> with yesterday's receipts.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mb-8">
          Upload products, log daily sales, then let an in-browser regression project your next 7, 30 or 90 days. Built for operators who want signals, not dashboards.
        </p>
        <div className="flex gap-3">
          <Link to="/auth?mode=signup">
            <Button size="lg" className="group">
              Open the workspace
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link to="/auth"><Button size="lg" variant="outline">Sign in</Button></Link>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-24">
        {features.map((f, i) => (
          <motion.div key={f.title}
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.08 }}
            className="glass-card p-6">
            <f.icon className="h-5 w-5 text-primary mb-4" />
            <h3 className="font-semibold mb-1">{f.title}</h3>
            <p className="text-sm text-muted-foreground">{f.body}</p>
          </motion.div>
        ))}
      </div>
    </section>

    <footer className="border-t border-border py-8">
      <div className="container text-xs text-muted-foreground font-mono flex justify-between">
        <span>FORECAST/OS</span>
        <span>STRUCTURED · TYPED · OPEN</span>
      </div>
    </footer>
  </div>
);

export default Landing;
