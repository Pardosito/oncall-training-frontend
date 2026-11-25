import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { api, unwrap } from "@/api/client";
import { qk } from "@/api/query-keys";
import { isTerminal, SESSION_POLL_MS } from "../lib/session";

/** The session, polled every 5 s until it's RESOLVED or FAILED (ARCHITECTURE §5). */
export function useSession(sessionId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: qk.sessions.detail(sessionId),
    queryFn: ({ signal }) =>
      unwrap(api.GET("/api/sessions/{sessionId}", { params: { path: { sessionId } }, signal })),
    refetchInterval: (query) => (isTerminal(query.state.data?.state) ? false : SESSION_POLL_MS),
    refetchIntervalInBackground: false,
  });
  const state = query.data?.state;

  // Once the session has ended, the user's history, stats and the leaderboard include it.
  useEffect(() => {
    if (!isTerminal(state)) return;
    void queryClient.invalidateQueries({ queryKey: qk.me.sessions });
    void queryClient.invalidateQueries({ queryKey: qk.me.stats() });
    void queryClient.invalidateQueries({ queryKey: qk.leaderboard() });
  }, [queryClient, state]);

  return query;
}
