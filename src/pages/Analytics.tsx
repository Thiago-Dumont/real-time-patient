import { useMemo, useState } from "react";
import { useConversations } from "@/lib/use-conversations";
import { PageHeader } from "@/components/PageHeader";
import { statusKey, STATUS_COLORS } from "@/lib/lead-score";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const RANGES = [
  { id: 7, label: "Últimos 7 dias" },
  { id: 30, label: "Últimos 30 dias" },
  { id: 90, label: "Últimos 90 dias" },
];

export function Analytics() {
  const { data } = useConversations();
  const [range, setRange] = useState(7);

  const filtered = useMemo(() => {
    const cut = subDays(new Date(), range).getTime();
    return data.filter((c) => new Date(c.created_at).getTime() >= cut);
  }, [data, range]);

  const stats = useMemo(() => {
    const numbers = new Set(filtered.map((c) => c.number));
    const agend = filtered.filter((c) => {
      const s = statusKey(c.status);
      return s === "agendado" || s === "confirmado";
    }).length;
    const fallback = filtered.filter((c) => statusKey(c.status) === "aguardando_humano").length;
    const cancel = filtered.filter((c) => statusKey(c.status) === "cancelado").length;
    return {
      total: filtered.length,
      contacts: numbers.size,
      schedRate: filtered.length ? ((agend / filtered.length) * 100).toFixed(1) : "0",
      fallbackRate: filtered.length ? ((fallback / filtered.length) * 100).toFixed(1) : "0",
      cancelRate: filtered.length ? ((cancel / filtered.length) * 100).toFixed(1) : "0",
    };
  }, [filtered]);

  const byDay = useMemo(() => {
    const days: { day: string; total: number }[] = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const s = startOfDay(d).getTime();
      const e = s + 86400000;
      days.push({
        day: format(d, "dd/MM", { locale: ptBR }),
        total: filtered.filter((c) => {
          const t = new Date(c.created_at).getTime();
          return t >= s && t < e;
        }).length,
      });
    }
    return days;
  }, [filtered, range]);

  const byStatus = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((c) => {
      const k = statusKey(c.status);
      m.set(k, (m.get(k) || 0) + 1);
    });
    return Array.from(m.entries()).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const byIntent = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((c) => {
      const k = (c.intent || "DESCONHECIDO").toUpperCase();
      m.set(k, (m.get(k) || 0) + 1);
    });
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const byHour = useMemo(() => {
    const arr = Array.from({ length: 24 }, (_, i) => ({ hour: `${String(i).padStart(2, "0")}h`, total: 0 }));
    filtered.forEach((c) => {
      const h = new Date(c.created_at).getHours();
      arr[h].total++;
    });
    return arr;
  }, [filtered]);

  return (
    <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-7xl mx-auto">
      <PageHeader title="Analíticos" subtitle="Métricas e tendências de atendimento" />

      <div className="flex gap-2 mb-6 flex-wrap">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={`px-3 py-1.5 rounded-md text-sm ${
              range === r.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Metric label="Total" value={stats.total} />
        <Metric label="Contatos únicos" value={stats.contacts} />
        <Metric label="Tx. agendamento" value={`${stats.schedRate}%`} />
        <Metric label="Tx. fallback humano" value={`${stats.fallbackRate}%`} />
        <Metric label="Tx. cancelamento" value={`${stats.cancelRate}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card title="Conversas por dia">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byDay}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6 }} />
              <Bar dataKey="total" fill="#00d4aa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Distribuição por status">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={byStatus} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                {byStatus.map((s) => <Cell key={s.name} fill={STATUS_COLORS[s.name] || "#6b7280"} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Intents mais frequentes">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byIntent} layout="vertical">
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
              <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={11} width={120} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6 }} />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Distribuição por horário">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={byHour}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="hour" stroke="var(--muted-foreground)" fontSize={10} interval={2} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 6 }} />
              <Bar dataKey="total" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
    </div>
  );
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      {children}
    </div>
  );
}