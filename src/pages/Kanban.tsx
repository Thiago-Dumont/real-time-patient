import { useMemo, useState } from "react";
import { useConversations } from "@/lib/use-conversations";
import { PageHeader } from "@/components/PageHeader";
import { KANBAN_COLUMNS, statusKey, computeLeadScore, STATUS_COLORS } from "@/lib/lead-score";
import { ConversationDetail } from "@/components/ConversationDetail";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageCircle, Search } from "lucide-react";
import type { Conversation } from "@/lib/supabase";

export function Kanban() {
  const { data, loading } = useConversations();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  // Latest conversation per number
  const latestPerNumber = useMemo(() => {
    const m = new Map<string, Conversation>();
    [...data]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .forEach((c) => {
        if (!m.has(c.number)) m.set(c.number, c);
      });
    return Array.from(m.values());
  }, [data]);

  const filtered = useMemo(() => {
    if (!q.trim()) return latestPerNumber;
    const ql = q.toLowerCase();
    return latestPerNumber.filter(
      (c) =>
        c.number.toLowerCase().includes(ql) ||
        (c.user_message || "").toLowerCase().includes(ql) ||
        (c.intent || "").toLowerCase().includes(ql) ||
        (c.status || "").toLowerCase().includes(ql),
    );
  }, [latestPerNumber, q]);

  const groups = useMemo(() => {
    const g = new Map<string, Conversation[]>();
    KANBAN_COLUMNS.forEach((col) => g.set(col.id, []));
    filtered.forEach((c) => {
      const k = statusKey(c.status);
      g.get(k)?.push(c);
    });
    return g;
  }, [filtered]);

  const allForSelected = useMemo(
    () => (selected ? data.filter((c) => c.number === selected) : []),
    [selected, data],
  );

  const openWhatsApp = (n: string) => {
    window.open(`https://wa.me/${n.replace(/\D/g, "")}`, "_blank");
  };

  return (
    <div className="p-4 lg:p-8 pt-16 lg:pt-8">
      <PageHeader title="Pipeline Kanban" subtitle="Visualização operacional do atendimento" />

      <div className="mb-4 relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por número, mensagem, intent..."
          className="w-full pl-9 pr-3 py-2 bg-input border border-border rounded-md text-sm"
        />
      </div>

      {loading && <p className="text-sm text-muted-foreground">Carregando...</p>}

      <div className="flex gap-3 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => {
          const items = groups.get(col.id) || [];
          const color = STATUS_COLORS[col.id] || "#6b7280";
          return (
            <div key={col.id} className="flex-shrink-0 w-72">
              <div className="bg-card border border-border rounded-lg flex flex-col h-[calc(100vh-220px)]">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-sm font-medium">{col.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {items.map((c) => {
                    const all = data.filter((d) => d.number === c.number);
                    const lead = computeLeadScore(all);
                    return (
                      <button
                        key={String(c.id)}
                        onClick={() => setSelected(c.number)}
                        className="w-full text-left bg-secondary hover:bg-secondary/70 rounded-md p-3 transition"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{c.number}</span>
                          <span className="text-[10px]" style={{ color: lead.color }}>
                            {lead.score}
                          </span>
                        </div>
                        <p className="text-xs line-clamp-2 mb-1">{c.user_message || "—"}</p>
                        {c.ai_response && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2">
                            IA: {c.ai_response}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="uppercase">{c.intent || "—"}</span>
                          <span>{format(new Date(c.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openWhatsApp(c.number);
                          }}
                          className="mt-2 w-full flex items-center justify-center gap-1 py-1 rounded text-[11px] bg-background hover:bg-background/70"
                        >
                          <MessageCircle size={11} /> Abrir WhatsApp
                        </button>
                      </button>
                    );
                  })}
                  {items.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Vazio</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <ConversationDetail
          number={selected}
          conversations={allForSelected}
          allForNumber={allForSelected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}