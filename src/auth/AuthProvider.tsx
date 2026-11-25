import type { ReactNode } from "react";
import type { Env } from "@/config/env";
import { CognitoAuthProvider } from "./CognitoAuthProvider";
import { DevAuthProvider } from "./DevAuthProvider";

/** Picks the auth implementation from the validated env. */
export function AuthProvider({ env, children }: { env: Env; children: ReactNode }) {
  if (env.authMode === "dev") {
    return <DevAuthProvider username={env.devUser}>{children}</DevAuthProvider>;
  }
  return <CognitoAuthProvider config={env.cognito}>{children}</CognitoAuthProvider>;
}
