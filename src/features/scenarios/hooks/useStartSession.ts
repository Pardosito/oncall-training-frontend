import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/api/client";
import { qk } from "@/api/query-keys";

/** POST /api/sessions. 201 → { sessionId }; 409 SESSION_BUSY and 404 surface as ApiError. */
export function useStartSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scenarioId: string) => unwrap(api.POST("/api/sessions", { body: { scenarioId } })),
    // The history list (and the "Return to incident" banner, FE-096) now has an active session.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: qk.me.sessions }),
  });
}
