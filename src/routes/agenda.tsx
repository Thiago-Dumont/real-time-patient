import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/Protected";
import { Agenda } from "@/pages/Agenda";

export const Route = createFileRoute("/agenda")({
  component: () => (<Protected><Agenda /></Protected>),
  head: () => ({ meta: [{ title: "Agenda via n8n — Saúde Total CRM" }] }),
});