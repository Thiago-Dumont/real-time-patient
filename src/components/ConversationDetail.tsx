import type { Conversation } from "@/lib/supabase";
import { computeLeadScore, statusKey, STATUS_COLORS, STATUS_MAP } from "@/lib/lead-score";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { X, Copy, MessageCircle } from "lucide-react";
import { useState } from "react";

export function ConversationDetail({
  number,
  conversations,
  allForNumber,
  onClose,
}: {
  number: string;
  conversations: Conversation[];
  allForNumber: Conversation[];
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const lead = computeLeadScore(allForNumber);
  const last = conversations[0];
  const sorted = [...allForNumber].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const openWhatsApp = () => {
    const clean = number.replace(/\D/g, "");
    window.open(`https://wa.me/${clean}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-full max-w-md bg-card border-l border-border overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Contato</div>
            <div className="font-semibold">{number}</div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-md">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-2">
            <button onClick={openWhatsApp} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium">
              <MessageCircle size={14} /> Abrir WhatsApp
            </button>
            <button onClick={copy} className="px-3 py-2 rounded-md bg-secondary text-sm flex items-center gap-2">
              <Copy size={14} /> {copied ? "Copiado" : "Copiar"}
            </button>
          </div>

          <div className="bg-secondary rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Lead Score</span>
              <span className="text-sm font-medium" style={{ color: lead.color }}>{lead.classification}</span>
            </div>
            <div className="w-full h-2 bg-background rounded-full overflow-hidden">
              <div className="h-full" style={{ width: `${lead.score}%`, background: lead.color }} />
            </div>
            <div className="text-right text-xs text-muted-foreground mt-1">{lead.score}/100</div>
          </div>

          {last && (
            <div className="space-y-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Última intenção</div>
                <div className="text-sm">{last.intent || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                <span
                  className="inline-block px-2 py-0.5 rounded-full text-xs"
                  style={{ background: STATUS_COLORS[statusKey(last.status)] + "33", color: STATUS_COLORS[statusKey(last.status)] }}
                >
                  {STATUS_MAP[statusKey(last.status)] || "Novo Contato"}
                </span>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Última mensagem</div>
                <div className="text-sm bg-secondary rounded-md p-3 whitespace-pre-wrap">{last.user_message || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Resposta da IA</div>
                <div className="text-sm bg-secondary rounded-md p-3 whitespace-pre-wrap">{last.ai_response || "—"}</div>
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(last.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </div>
            </div>
          )}

          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">Linha do tempo ({sorted.length})</div>
            <div className="space-y-2">
              {sorted.map((c) => (
                <div key={String(c.id)} className="border-l-2 pl-3 py-1" style={{ borderColor: STATUS_COLORS[statusKey(c.status)] || "#6b7280" }}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{c.intent || "—"}</span>
                    <span className="text-muted-foreground">{format(new Date(c.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                  </div>
                  <p className="text-sm mt-0.5 line-clamp-2">{c.user_message || "—"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}