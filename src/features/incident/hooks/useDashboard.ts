import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/api/client";
import { qk } from "@/api/query-keys";
import { DASHBOARD_POLL_MS, isTerminal } from "../lib/session";

/**
 * The live snapshot, polled every 2 s while the session runs and paused when the tab is hidden
 * (ARCHITECTURE §5). The last snapshot stays on screen during refetches: no spinner, no flicker.
 */
export function useDashboard(sessionId: string, { active }: { active: boolean }) {
  return useQuery({
    queryKey: qk.sessions.dashboard(sessionId),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET("/api/sessions/{sessionId}/dashboard", { params: { path: { sessionId } }, signal }),
      ),
    refetchInterval: (query) =>
      active && !isTerminal(query.state.data?.state) ? DASHBOARD_POLL_MS : false,
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}
