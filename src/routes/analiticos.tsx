import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/Protected";
import { Analytics } from "@/pages/Analytics";

export const Route = createFileRoute("/analiticos")({
  component: () => (<Protected><Analytics /></Protected>),
  head: () => ({ meta: [{ title: "Analíticos — Saúde Total CRM" }] }),
});