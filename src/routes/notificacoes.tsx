import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/Protected";
import { Notifications } from "@/pages/Notifications";

export const Route = createFileRoute("/notificacoes")({
  component: () => (<Protected><Notifications /></Protected>),
  head: () => ({ meta: [{ title: "Notificações — Saúde Total CRM" }] }),
});