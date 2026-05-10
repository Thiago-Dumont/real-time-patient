import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/Protected";
import { Contacts } from "@/pages/Contacts";

export const Route = createFileRoute("/contatos")({
  component: () => (<Protected><Contacts /></Protected>),
  head: () => ({ meta: [{ title: "Contatos — Saúde Total CRM" }] }),
});