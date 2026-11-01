import { useMemo, type ReactNode } from "react";
import { setAuthHeadersProvider } from "@/api/auth-headers";
import { AuthContext, type AuthState } from "./auth-context";

export const DEV_USER_HEADER = "x-dev-user";

/**
 * Dev auth (VITE_AUTH_MODE=dev): the user is always signed in as VITE_DEV_USER and requests carry
 * `x-dev-user`, which the backend accepts with AUTH_MODE=dev (ARCHITECTURE §4, DECISIONS D-18).
 * Builds refuse this mode (vite.config.ts).
 */
export function DevAuthProvider({ username, children }: { username: string; children: ReactNode }) {
  // Registered during render (idempotent) so it's in place before any child query effect runs.
  setAuthHeadersProvider(() => ({ [DEV_USER_HEADER]: username }));

  const value = useMemo<AuthState>(
    () => ({
      status: "authenticated",
      user: { userId: username, username },
      signIn: () => undefined,
      signOut: () => window.location.assign("/"),
    }),
    [username],
  );
  return <AuthContext value={value}>{children}</AuthContext>;
}
