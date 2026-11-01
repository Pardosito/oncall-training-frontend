import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrap } from "@/api/client";
import { errorMessage } from "@/api/error-messages";
import { isApiError } from "@/api/errors";
import { qk } from "@/api/query-keys";
import type { ActionRequest } from "@/api/types";
import { useToast } from "@/components";
import { actionLabel } from "@/lib/actions";

/**
 * POST …/actions. A 202 only means "queued": the effect shows up on a later poll, and the
 * dashboard isn't changed optimistically (DECISIONS D-08).
 */
export function useSendAction(sessionId: string) {
  const toast = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: ActionRequest) =>
      unwrap(
        api.POST("/api/sessions/{sessionId}/actions", {
          params: { path: { sessionId } },
          body: action,
        }),
      ),
    onSuccess: (_data, action) => {
      toast({ kind: "info", title: `Action queued: ${actionLabel(action)}` });
    },
    onError: (error, action) => {
      if (isApiError(error) && error.code === "SESSION_NOT_ACTIVE") {
        // The session ended meanwhile; refetching switches the page to the result view.
        void queryClient.invalidateQueries({ queryKey: qk.sessions.detail(sessionId) });
      }
      toast({
        kind: "error",
        title: `${actionLabel(action)} failed`,
        subtitle: errorMessage(error),
      });
    },
  });
}
