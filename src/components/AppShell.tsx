import { useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useConversations } from "@/lib/use-conversations";
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  BarChart3,
  Bell,
  CalendarClock,
  LogOut,
  Menu,
  X,
  Activity,
} from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/kanban", label: "Pipeline", icon: KanbanSquare },
  { to: "/contatos", label: "Contatos", icon: Users },
  { to: "/analiticos", label: "Analíticos", icon: BarChart3 },
  { to: "/notificacoes", label: "Notificações", icon: Bell, badge: true },
  { to: "/agenda", label: "Agenda via n8n", icon: CalendarClock },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { signOut, session } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { data, realtime } = useConversations();

  const alerts = data.filter((c) => {
    const s = (c.status || "").toLowerCase();
    return s === "aguardando_humano" || s === "cancelado" || !c.ai_response;
  }).length;

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Mobile toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-md bg-card border border-border"
        aria-label="Menu"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static z-40 inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform`}
      >
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
              S
            </div>
            <div>
              <div className="font-semibold text-sm leading-tight">Saúde Total</div>
              <div className="text-xs text-muted-foreground">CRM Médico</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map((item) => {
            const active = item.exact ? path === item.to : path.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon size={18} />
                  {item.label}
                </span>
                {item.badge && alerts > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground">
                    {alerts}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
            <Activity
              size={12}
              className={realtime ? "text-primary" : "text-muted-foreground"}
            />
            <span>{realtime ? "Tempo real ativo" : "Conectando..."}</span>
          </div>
          <div className="px-2 text-xs text-muted-foreground truncate">
            {session?.user?.email}
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          >
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setOpen(false)}
        />
      )}

      <main className="flex-1 min-w-0 lg:ml-0">{children}</main>
    </div>
  );
}