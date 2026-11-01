import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useAuth } from "./useAuth";

/** Clears every cached query (CONVENTIONS §6: the one place `clear()` is allowed), then signs out. */
export function useSignOut(): () => void {
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  return useCallback(() => {
    queryClient.clear();
    signOut();
  }, [queryClient, signOut]);
}
