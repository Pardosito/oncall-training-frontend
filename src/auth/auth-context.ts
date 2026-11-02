import { createContext } from "react";

export type CurrentUser = {
  /** Cognito `sub` (the dev username in dev auth). Never sent to the API. */
  userId: string;
  username: string;
};

export type AuthState = {
  status: "loading" | "authenticated" | "unauthenticated";
  user: CurrentUser | null;
  /** Sends the user to sign in, then back to `returnTo` (a same-origin path). */
  signIn: (returnTo: string) => void;
  /** Ends the session. Callers clear the query cache first (see useSignOut). */
  signOut: () => void;
};

/** One interface, two implementations: dev auth now, Cognito in M2 (Front plan P-04). */
export const AuthContext = createContext<AuthState | null>(null);
