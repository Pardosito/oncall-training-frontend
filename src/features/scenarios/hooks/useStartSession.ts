import { useMutation } from "@tanstack/react-query";
import { api, unwrap } from "@/api/client";

/** POST /api/sessions. 201 → { sessionId }; 409 SESSION_BUSY and 404 surface as ApiError. */
export function useStartSession() {
  return useMutation({
    mutationFn: (scenarioId: string) => unwrap(api.POST("/api/sessions", { body: { scenarioId } })),
  });
}
