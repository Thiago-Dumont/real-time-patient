import { AppShell } from "./AppShell";
import type { ReactNode } from "react";

export function Protected({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
