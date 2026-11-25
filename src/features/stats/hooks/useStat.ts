import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/api/client";
import { qk } from "@/api/query-keys";
import type { ScoreRow, StatsQueryName, TtdTtrRow } from "@/api/types";

type RowsOf = { "score-over-time": ScoreRow[]; "ttd-ttr-by-attempt": TtdTtrRow[] };

/** One named stat of the signed-in user (FE-105). Rows are oldest attempt first. */
export function useStat<Q extends StatsQueryName>(queryName: Q) {
  return useQuery({
    queryKey: qk.me.stats(queryName),
    queryFn: async ({ signal }) => {
      const body = await unwrap(
        api.GET("/api/me/stats/{queryName}", { params: { path: { queryName } }, signal }),
      );
      return body.rows as RowsOf[Q];
    },
    staleTime: 30_000,
  });
}
