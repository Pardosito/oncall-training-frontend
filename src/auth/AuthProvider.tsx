import type { ReactNode } from "react";
import type { Env } from "@/config/env";
import { DevAuthProvider } from "./DevAuthProvider";
import { CognitoNotAvailable } from "./CognitoNotAvailable";

/** Picks the auth implementation from the validated env. */
export function AuthProvider({ env, children }: { env: Env; children: ReactNode }) {
  if (env.authMode === "dev") {
    return <DevAuthProvider username={env.devUser}>{children}</DevAuthProvider>;
  }
  // Cognito sign-in (FE-040, FE-042, FE-027, FE-045) moves to M2 with infra's Cognito
  // (Front plan §5, DECISIONS D-20).
  return <CognitoNotAvailable />;
}
