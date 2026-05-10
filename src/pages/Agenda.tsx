import { useMemo, useState } from "react";
import { useConversations } from "@/lib/use-conversations";
import { PageHeader } from "@/components/PageHeader";
import { N8N_WEBHOOKS } from "@/lib/supabase";
import { computeLeadScore } from "@/lib/lead-score";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarClock, Send, AlertTriangle, CheckCircle2 } from "lucide-react";

const TARGET_INTENTS = ["AGENDAR", "REAGENDAR", "CONFIRMAR"];

export function Agenda() {
  const { data } = useConversations();
  const [sending, setSending] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; ok: boolean; msg: string } | null>(null);

  const events = useMemo(() => {
    return data
      .filter((c) => TARGET_INTENTS.includes((c.intent || "").toUpperCase()))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [data]);

  const configured = !!(N8N_WEBHOOKS.create || N8N_WEBHOOKS.update || N8N_WEBHOOKS.cancel);

  const send = async (c: any) => {
    if (!N8N_WEBHOOKS.create) {
      setFeedback({ id: String(c.id), ok: false, msg: "Webhook não configurado." });
      return;
    }
    setSending(String(c.id));
    setFeedback(null);
    const all = data.filter((d) => d.number === c.number);
    const lead = computeLeadScore(all);
    const payload = {
      number: c.number,
      user_message: c.user_message,
      ai_response: c.ai_response,
      intent: c.intent,
      status: c.status,
      created_at: c.created_at,
      lead_score: lead.score,
      lead_classification: lead.classification,
    };
    try {
      const res = await fetch(N8N_WEBHOOKS.create, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) setFeedback({ id: String(c.id), ok: true, msg: "Enviado para o n8n" });
      else setFeedback({ id: String(c.id), ok: false, msg: `Falha (${res.status})` });
    } catch (e: any) {
      setFeedback({ id: String(c.id), ok: false, msg: e?.message || "Erro de rede" });
    }
    setSending(null);
  };

  return (
    <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-5xl mx-auto">
      <PageHeader title="Agenda via n8n" subtitle="Integração futura com Google Agenda" />

      <div className={`mb-6 rounded-lg border p-4 flex items-start gap-3 ${configured ? "bg-primary/10 border-primary/30" : "bg-secondary border-border"}`}>
        {configured ? <CheckCircle2 className="text-primary mt-0.5" size={18} /> : <AlertTriangle className="text-muted-foreground mt-0.5" size={18} />}
        <div className="flex-1">
          <div className="text-sm font-medium">
            {configured ? "Integração configurada" : "Integração não configurada"}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {configured
              ? "Os webhooks do n8n estão disponíveis. Eventos podem ser enviados para o fluxo do Google Agenda."
              : "Defina as variáveis VITE_N8N_WEBHOOK_CREATE_EVENT, VITE_N8N_WEBHOOK_UPDATE_EVENT e VITE_N8N_WEBHOOK_CANCEL_EVENT no ambiente para ativar o envio."}
          </p>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            <WebhookRow label="Criar evento" value={N8N_WEBHOOKS.create} />
            <WebhookRow label="Atualizar evento" value={N8N_WEBHOOKS.update} />
            <WebhookRow label="Cancelar evento" value={N8N_WEBHOOKS.cancel} />
          </div>
        </div>
      </div>

      <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
        <CalendarClock size={16} /> Conversas relacionadas a agendamento ({events.length})
      </h2>

      <div className="space-y-2">
        {events.length === 0 && (
          <div className="bg-card border border-border rounded-lg p-4 text-sm text-muted-foreground">
            Nenhuma conversa com intent AGENDAR, REAGENDAR ou CONFIRMAR.
          </div>
        )}
        {events.map((c) => (
          <div key={String(c.id)} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{c.number}</span>
                  <span>•</span>
                  <span className="uppercase">{c.intent}</span>
                  <span>•</span>
                  <span>{format(new Date(c.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                </div>
                <p className="text-sm mt-1 line-clamp-2">{c.user_message || "—"}</p>
              </div>
              <button
                onClick={() => send(c)}
                disabled={!configured || sending === String(c.id)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
              >
                <Send size={12} />
                {sending === String(c.id) ? "Enviando..." : "Enviar para agenda via n8n"}
              </button>
            </div>
            {feedback?.id === String(c.id) && (
              <div className={`mt-2 text-xs ${feedback.ok ? "text-primary" : "text-destructive"}`}>
                {feedback.msg}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function WebhookRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-background rounded-md p-2 border border-border">
      <div className="text-muted-foreground">{label}</div>
      <div className="truncate">{value || <span className="text-destructive">não configurado</span>}</div>
    </div>
  );
}