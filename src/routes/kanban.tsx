import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/Protected";
import { Kanban } from "@/pages/Kanban";

export const Route = createFileRoute("/kanban")({
  component: () => (<Protected><Kanban /></Protected>),
  head: () => ({ meta: [{ title: "Pipeline — Saúde Total CRM" }] }),
});