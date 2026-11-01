import { Theme } from "@carbon/react";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AuthProvider } from "@/auth";
import { ToastProvider } from "@/components";
import type { Env } from "@/config/env";

/** Outermost → innermost: Theme → Auth → Query → Toasts (ARCHITECTURE §2). */
export function Providers({
  env,
  queryClient,
  children,
}: {
  env: Env;
  queryClient: QueryClient;
  children: ReactNode;
}) {
  return (
    <Theme theme="g100">
      <AuthProvider env={env}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>{children}</ToastProvider>
        </QueryClientProvider>
      </AuthProvider>
    </Theme>
  );
}
