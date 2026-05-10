import { Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { AppShell } from "./AppShell";
import type { ReactNode } from "react";

export function Protected({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground text-sm">
        Carregando...
      </div>
    );
  }
  if (!session) return <Navigate to="/login" />;
  return <AppShell>{children}</AppShell>;
}