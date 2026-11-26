import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/api/client";
import { qk } from "@/api/query-keys";

/**
 * VIEW_LOGS (FE-088): the last lines of one service, fetched only when asked for. No polling:
 * the user refreshes on purpose, and each read is recorded as an action by the backend.
 */
export function useLogs(sessionId: string, service: string | null) {
  return useQuery({
    queryKey: qk.sessions.logs(sessionId, service ?? ""),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET("/api/sessions/{sessionId}/logs", {
          params: { path: { sessionId }, query: { service: service ?? "" } },
          signal,
        }),
      ),
    enabled: service !== null,
    staleTime: Infinity,
    retry: false,
  });
}
