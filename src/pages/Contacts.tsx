import { useMemo, useState } from "react";
import { useConversations } from "@/lib/use-conversations";
import { PageHeader } from "@/components/PageHeader";
import { ConversationDetail } from "@/components/ConversationDetail";
import { computeLeadScore, statusKey, STATUS_COLORS, STATUS_MAP } from "@/lib/lead-score";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, MessageCircle, Eye } from "lucide-react";

export function Contacts() {
  const { data } = useConversations();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const contacts = useMemo(() => {
    const m = new Map<string, typeof data>();
    data.forEach((c) => {
      const arr = m.get(c.number) || [];
      arr.push(c);
      m.set(c.number, arr);
    });
    const list = Array.from(m.entries()).map(([number, convs]) => {
      const sorted = [...convs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const last = sorted[0];
      const lead = computeLeadScore(convs);
      return {
        number,
        total: convs.length,
        last,
        lead,
        all: convs,
      };
    });
    list.sort((a, b) => new Date(b.last.created_at).getTime() - new Date(a.last.created_at).getTime());
    if (!q.trim()) return list;
    const ql = q.toLowerCase();
    return list.filter(
      (c) =>
        c.number.toLowerCase().includes(ql) ||
        (c.last.intent || "").toLowerCase().includes(ql) ||
        (c.last.status || "").toLowerCase().includes(ql) ||
        (c.last.user_message || "").toLowerCase().includes(ql),
    );
  }, [data, q]);

  const selectedAll = selected ? data.filter((d) => d.number === selected) : [];

  return (
    <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-7xl mx-auto">
      <PageHeader title="Contatos" subtitle={`${contacts.length} contatos únicos`} />

      <div className="mb-4 relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar..."
          className="w-full pl-9 pr-3 py-2 bg-input border border-border rounded-md text-sm"
        />
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Número</th>
              <th className="text-left px-4 py-2 font-medium">Conversas</th>
              <th className="text-left px-4 py-2 font-medium">Última</th>
              <th className="text-left px-4 py-2 font-medium">Intent</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-left px-4 py-2 font-medium">Lead</th>
              <th className="text-right px-4 py-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.number} className="border-t border-border hover:bg-secondary/50">
                <td className="px-4 py-3 font-medium">{c.number}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.total}</td>
                <td className="px-4 py-3 text-muted-foreground">{format(new Date(c.last.created_at), "dd/MM HH:mm", { locale: ptBR })}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.last.intent || "—"}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: STATUS_COLORS[statusKey(c.last.status)] + "33", color: STATUS_COLORS[statusKey(c.last.status)] }}>
                    {STATUS_MAP[statusKey(c.last.status)] || "Novo"}
                  </span>
                </td>
                <td className="px-4 py-3" style={{ color: c.lead.color }}>{c.lead.score} • {c.lead.classification}</td>
                <td className="px-4 py-3 text-right space-x-1">
                  <button onClick={() => setSelected(c.number)} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-secondary hover:bg-secondary/70">
                    <Eye size={12} /> Abrir
                  </button>
                  <button onClick={() => window.open(`https://wa.me/${c.number.replace(/\D/g, "")}`, "_blank")} className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-primary text-primary-foreground">
                    <MessageCircle size={12} /> WhatsApp
                  </button>
                </td>
              </tr>
            ))}
            {contacts.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">Nenhum contato encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {contacts.map((c) => (
          <button key={c.number} onClick={() => setSelected(c.number)} className="w-full text-left bg-card border border-border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{c.number}</span>
              <span className="text-xs" style={{ color: c.lead.color }}>{c.lead.score}</span>
            </div>
            <div className="text-xs text-muted-foreground mb-1">{c.total} conversas • {format(new Date(c.last.created_at), "dd/MM HH:mm")}</div>
            <p className="text-sm line-clamp-1">{c.last.user_message || "—"}</p>
          </button>
        ))}
      </div>

      {selected && (
        <ConversationDetail
          number={selected}
          conversations={selectedAll}
          allForNumber={selectedAll}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}