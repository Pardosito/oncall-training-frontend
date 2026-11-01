import type { CurrentUser } from "./auth-context";
import { useAuth } from "./useAuth";

/** The signed-in user, or null. For display and for marking the user's own rows only. */
export function useCurrentUser(): CurrentUser | null {
  return useAuth().user;
}
