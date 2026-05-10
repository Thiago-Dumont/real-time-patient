import type { Conversation } from "./supabase";

const KEYWORDS = ["preço", "preco", "valor", "horário", "horario", "consulta", "marcar", "agendar"];

export function computeLeadScore(
  convs: Conversation[],
): { score: number; classification: string; color: string } {
  if (!convs || convs.length === 0) {
    return { score: 0, classification: "Baixa intenção", color: "#6b7280" };
  }
  const sorted = [...convs].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const last = sorted[0];
  let score = 0;
  const intent = (last.intent || "").toUpperCase();
  if (intent === "AGENDAR" || intent === "CONFIRMAR") score += 40;
  if (intent === "REAGENDAR") score += 30;
  if (convs.length > 1) score += 20;
  const today = new Date();
  const lastDate = new Date(last.created_at);
  if (
    today.toDateString() === lastDate.toDateString()
  ) score += 10;
  if (intent === "CANCELAR") score -= 20;
  const msg = (last.user_message || "").toLowerCase();
  if (KEYWORDS.some((k) => msg.includes(k))) score += 10;
  const status = (last.status || "").toLowerCase();
  if (status === "agendado" || status === "confirmado") score += 10;
  score = Math.max(0, Math.min(100, score));
  let classification = "Baixa intenção";
  let color = "#6b7280";
  if (score >= 80) { classification = "Lead quente"; color = "#ef4444"; }
  else if (score >= 50) { classification = "Lead morno"; color = "#f59e0b"; }
  else if (score >= 20) { classification = "Lead frio"; color = "#3b82f6"; }
  return { score, classification, color };
}

export const STATUS_MAP: Record<string, string> = {
  ativo: "Em Atendimento",
  aguardando_humano: "Aguardando Humano",
  agendado: "Consulta Agendada",
  confirmado: "Confirmado",
  encerrado: "Encerrado",
  cancelado: "Cancelado",
};

export const STATUS_COLORS: Record<string, string> = {
  ativo: "#00d4aa",
  aguardando_humano: "#f59e0b",
  encerrado: "#6b7280",
  agendado: "#3b82f6",
  confirmado: "#22c55e",
  cancelado: "#ef4444",
  novo: "#8b5cf6",
};

export const KANBAN_COLUMNS = [
  { id: "novo", title: "Novo Contato" },
  { id: "ativo", title: "Em Atendimento" },
  { id: "aguardando_humano", title: "Aguardando Humano" },
  { id: "agendado", title: "Consulta Agendada" },
  { id: "confirmado", title: "Confirmado" },
  { id: "encerrado", title: "Encerrado" },
  { id: "cancelado", title: "Cancelado" },
];

export function statusKey(status: string | null | undefined): string {
  const s = (status || "").toLowerCase().trim();
  if (!s) return "novo";
  if (s in STATUS_MAP) return s;
  return "novo";
}