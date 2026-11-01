import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/api/client";
import { qk } from "@/api/query-keys";
import { isTerminal, SESSION_POLL_MS } from "../lib/session";

/** The session, polled every 5 s until it's RESOLVED or FAILED (ARCHITECTURE §5). */
export function useSession(sessionId: string) {
  return useQuery({
    queryKey: qk.sessions.detail(sessionId),
    queryFn: ({ signal }) =>
      unwrap(api.GET("/api/sessions/{sessionId}", { params: { path: { sessionId } }, signal })),
    refetchInterval: (query) => (isTerminal(query.state.data?.state) ? false : SESSION_POLL_MS),
    refetchIntervalInBackground: false,
  });
}
