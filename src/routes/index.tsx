import { createFileRoute } from "@tanstack/react-router";
import { Protected } from "@/components/Protected";
import { Dashboard } from "@/pages/Dashboard";

export const Route = createFileRoute("/")({
  component: () => (
    <Protected>
      <Dashboard />
    </Protected>
  ),
  head: () => ({
    meta: [{ title: "Dashboard — Saúde Total CRM" }],
  }),
});
