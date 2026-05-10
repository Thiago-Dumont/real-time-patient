import { useMemo, useState } from "react";
import { useConversations } from "@/lib/use-conversations";
import { PageHeader } from "@/components/PageHeader";
import { ConversationDetail } from "@/components/ConversationDetail";
import { statusKey, STATUS_COLORS } from "@/lib/lead-score";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, XCircle, MessageSquareWarning, HelpCircle } from "lucide-react";

export function Notifications() {
  const { data } = useConversations();
  const [selected, setSelected] = useState<string | null>(null);

  const groups = useMemo(() => {
    return {
      aguardando: data.filter((c) => statusKey(c.status) === "aguardando_humano"),
      cancel: data.filter((c) => statusKey(c.status) === "cancelado"),
      semResposta: data.filter((c) => !c.ai_response || !c.ai_response.trim()),
      desconhecido: data.filter((c) => {
        const s = (c.status || "").toLowerCase().trim();
        return s && !["ativo", "aguardando_humano", "agendado", "confirmado", "encerrado", "cancelado"].includes(s);
      }),
    };
  }, [data]);

  const allForSelected = selected ? data.filter((d) => d.number === selected) : [];

  return (
    <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-5xl mx-auto">
      <PageHeader title="Notificações" subtitle="Itens que precisam de atenção" />

      <Section
        icon={AlertCircle}
        color="#f59e0b"
        title="Aguardando atendimento humano"
        items={groups.aguardando}
        onSelect={setSelected}
      />
      <Section
        icon={XCircle}
        color="#ef4444"
        title="Cancelamentos"
        items={groups.cancel}
        onSelect={setSelected}
      />
      <Section
        icon={MessageSquareWarning}
        color="#3b82f6"
        title="Sem resposta da IA"
        items={groups.semResposta}
        onSelect={setSelected}
      />
      <Section
        icon={HelpCircle}
        color="#8b5cf6"
        title="Status desconhecido"
        items={groups.desconhecido}
        onSelect={setSelected}
      />

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

function Section({
  icon: Icon, color, title, items, onSelect,
}: { icon: any; color: string; title: string; items: any[]; onSelect: (n: string) => void }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} style={{ color }} />
        <h2 className="font-medium">{title}</h2>
        <span className="text-xs text-muted-foreground">({items.length})</span>
      </div>
      {items.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-4 text-sm text-muted-foreground">
          Nada por aqui.
        </div>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 20).map((c) => (
            <button
              key={String(c.id)}
              onClick={() => onSelect(c.number)}
              className="w-full text-left bg-card border border-border hover:bg-secondary/50 rounded-lg p-3"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">{c.number}</span>
                <span className="text-xs text-muted-foreground">{format(new Date(c.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
              </div>
              <p className="text-sm line-clamp-1">{c.user_message || "—"}</p>
              <div className="text-xs mt-1" style={{ color: STATUS_COLORS[statusKey(c.status)] }}>
                {c.intent || "—"} • {c.status || "novo"}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}