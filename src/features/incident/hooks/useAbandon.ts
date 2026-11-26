import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/api/client";
import { errorMessage } from "@/api/error-messages";
import { isApiError } from "@/api/errors";
import { qk } from "@/api/query-keys";
import { useToast } from "@/components";

/**
 * POST …/abandon (FE-089). A 202 only queues it: the session keeps polling until the worker
 * marks it FAILED with `failureReason: ABANDONED`, and the page switches to the result view.
 */
export function useAbandon(sessionId: string) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const refreshSession = () =>
    void queryClient.invalidateQueries({ queryKey: qk.sessions.detail(sessionId) });

  return useMutation({
    mutationFn: () =>
      unwrap(api.POST("/api/sessions/{sessionId}/abandon", { params: { path: { sessionId } } })),
    onSuccess: () => {
      toast({ kind: "info", title: "Abandoning the incident…" });
      refreshSession();
    },
    onError: (error) => {
      // Already ended: refetching shows the result view.
      if (isApiError(error) && error.code === "SESSION_NOT_ACTIVE") refreshSession();
      toast({ kind: "error", title: "Abandon failed", subtitle: errorMessage(error) });
    },
  });
}
