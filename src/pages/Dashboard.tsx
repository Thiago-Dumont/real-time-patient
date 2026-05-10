import { useMemo } from "react";
import { useConversations } from "@/lib/use-conversations";
import { PageHeader } from "@/components/PageHeader";
import { computeLeadScore, statusKey, STATUS_COLORS } from "@/lib/lead-score";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Users, MessageSquare, Clock, AlertCircle, XCircle, Flame, CalendarCheck, Activity } from "lucide-react";
import { N8N_WEBHOOKS } from "@/lib/supabase";

function Stat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: number | string; accent?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon size={16} style={{ color: accent || "var(--muted-foreground)" }} />
      </div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
    </div>
  );
}

export function Dashboard() {
  const { data, loading, realtime, error } = useConversations();

  const stats = useMemo(() => {
    const today = startOfDay(new Date()).getTime();
    const byNumber = new Map<string, typeof data>();
    data.forEach((c) => {
      const arr = byNumber.get(c.number) || [];
      arr.push(c);
      byNumber.set(c.number, arr);
    });
    const todayCount = data.filter((c) => new Date(c.created_at).getTime() >= today).length;
    const aguardando = data.filter((c) => statusKey(c.status) === "aguardando_humano").length;
    const cancel = data.filter((c) => statusKey(c.status) === "cancelado").length;
    const agend = data.filter((c) => {
      const s = statusKey(c.status);
      return s === "agendado" || s === "confirmado";
    }).length;
    let hot = 0;
    byNumber.forEach((arr) => {
      const { score } = computeLeadScore(arr);
      if (score >= 80) hot++;
    });
    return {
      contacts: byNumber.size,
      total: data.length,
      today: todayCount,
      aguardando,
      cancel,
      agend,
      hot,
    };
  }, [data]);

  const last7 = useMemo(() => {
    const days: { day: string; total: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const start = startOfDay(d).getTime();
      const end = start + 86400000;
      const total = data.filter((c) => {
        const t = new Date(c.created_at).getTime();
        return t >= start && t < end;
      }).length;
      days.push({ day: format(d, "dd/MM", { locale: ptBR }), total });
    }
    return days;
  }, [data]);

  const byStatus = useMemo(() => {
    const m = new Map<string, number>();
    data.forEach((c) => {
      const k = statusKey(c.status);
      m.set(k, (m.get(k) || 0) + 1);
    });
    return Array.from(m.entries()).map(([name, value]) => ({ name, value }));
  }, [data]);

  const byIntent = useMemo(() => {
    const m = new Map<string, number>();
    data.forEach((c) => {
      const k = (c.intent || "DESCONHECIDO").toUpperCase();
      m.set(k, (m.get(k) || 0) + 1);
    });
    return Array.from(m.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));
  }, [data]);

  const feed = data.slice(0, 5);

  const n8nConfigured = !!(N8N_WEBHOOKS.create || N8N_WEBHOOKS.update || N8N_WEBHOOKS.cancel);

  return (
    <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-7xl mx-auto">
      <PageHeader title="Dashboard" subtitle="Visão geral do atendimento em tempo real" />

      {error && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          Erro ao carregar dados: {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat icon={Users} label="Contatos únicos" value={stats.contacts} accent="#00d4aa" />
        <Stat icon={MessageSquare} label="Total de conversas" value={stats.total} />
        <Stat icon={Clock} label="Conversas hoje" value={stats.today} accent="#3b82f6" />
        <Stat icon={AlertCircle} label="Aguardando humano" value={stats.aguardando} accent="#f59e0b" />
        <Stat icon={XCircle} label="Cancelamentos" value={stats.cancel} accent="#ef4444" />
        <Stat icon={Flame} label="Leads quentes" value={stats.hot} accent="#ef4444" />
        <Stat icon={CalendarCheck} label="Agendamentos" value={stats.agend} accent="#22c55e" />
        <Stat icon={Activity} label="Status" value={loading ? "..." : "Online"} accent="#00d4aa" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium mb-4">Conversas — últimos 7 dias</h3>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={last7}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6 }} />
                <Bar dataKey="total" fill="#00d4aa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium mb-4">Por status</h3>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                  {byStatus.map((s) => (
                    <Cell key={s.name} fill={STATUS_COLORS[s.name] || "#6b7280"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1 mt-2">
            {byStatus.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLORS[s.name] || "#6b7280" }} />
                  {s.name}
                </span>
                <span className="text-muted-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium mb-4">Intents mais frequentes</h3>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <BarChart data={byIntent} layout="vertical">
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={12} width={110} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6 }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium">Feed ao vivo</h3>
            <span className="text-xs flex items-center gap-1 text-muted-foreground">
              <span className={`w-2 h-2 rounded-full ${realtime ? "bg-primary animate-pulse" : "bg-muted-foreground"}`} />
              {realtime ? "Tempo real" : "Aguardando"}
            </span>
          </div>
          <div className="space-y-3">
            {feed.length === 0 && (
              <p className="text-xs text-muted-foreground">Nenhuma conversa ainda.</p>
            )}
            {feed.map((c) => (
              <div key={String(c.id)} className="border-l-2 pl-3" style={{ borderColor: STATUS_COLORS[statusKey(c.status)] || "#6b7280" }}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{c.number}</span>
                  <span className="text-muted-foreground">{format(new Date(c.created_at), "HH:mm", { locale: ptBR })}</span>
                </div>
                <p className="text-sm mt-0.5 line-clamp-1">{c.user_message || "—"}</p>
                <div className="flex gap-2 mt-1 text-[10px] text-muted-foreground uppercase">
                  <span>{c.intent || "—"}</span>
                  <span>•</span>
                  <span>{c.status || "novo"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium mb-3">Status do sistema</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <SysStatus label="Supabase" ok={!error} />
          <SysStatus label="Tempo real" ok={realtime} />
          <SysStatus label="Atualização 30s" ok={true} />
          <SysStatus label="Integração n8n" ok={n8nConfigured} okText={n8nConfigured ? "Configurado" : "Não configurado"} />
        </div>
      </div>
    </div>
  );
}

function SysStatus({ label, ok, okText }: { label: string; ok: boolean; okText?: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-md bg-secondary">
      <span className="text-muted-foreground">{label}</span>
      <span className={`flex items-center gap-1.5 ${ok ? "text-primary" : "text-muted-foreground"}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${ok ? "bg-primary" : "bg-muted-foreground"}`} />
        {okText || (ok ? "Ativo" : "Inativo")}
      </span>
    </div>
  );
}