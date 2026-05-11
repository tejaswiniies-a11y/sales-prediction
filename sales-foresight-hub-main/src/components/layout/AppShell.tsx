import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, LineChart, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/products", label: "Products", icon: Package },
  { to: "/app/predict", label: "Predict", icon: LineChart },
];

const AppShell = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r border-border bg-card/40 backdrop-blur-xl hidden md:flex flex-col">
        <Link to="/" className="px-6 py-6 flex items-center gap-2 border-b border-border">
          <span className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="font-semibold tracking-tight">Forecast<span className="text-primary">/</span>OS</span>
        </Link>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to} to={to} end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`
              }
            >
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <p className="px-3 text-xs text-muted-foreground truncate mb-2">{user?.email}</p>
          <Button variant="ghost" size="sm" className="w-full justify-start"
            onClick={async () => { await signOut(); navigate("/"); }}>
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
