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
  /** Why the last sign-in failed (Cognito only), for the /callback error state. */
  error?: string | null;
  /** Where to go after the sign-in callback (from the sign-in request's state). */
  returnTo?: string | null;
};

/** One interface, two implementations: dev auth and Cognito (Front plan P-04). */
export const AuthContext = createContext<AuthState | null>(null);
