import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/api/client";
import { qk } from "@/api/query-keys";

export const LEADERBOARD_SIZE = 10;

/** Top scores of a scenario (FE-110). `isYou` marks the signed-in user's rows. */
export function useLeaderboard(scenarioId: string | undefined) {
  return useQuery({
    queryKey: qk.leaderboard(scenarioId ?? ""),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET("/api/leaderboard/{scenarioId}", {
          params: { path: { scenarioId: scenarioId ?? "" }, query: { limit: LEADERBOARD_SIZE } },
          signal,
        }),
      ),
    enabled: Boolean(scenarioId),
    staleTime: 30_000,
  });
}
