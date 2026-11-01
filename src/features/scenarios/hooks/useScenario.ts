import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/api/client";
import { qk } from "@/api/query-keys";

export function useScenario(scenarioId: string) {
  return useQuery({
    queryKey: qk.scenarios.detail(scenarioId),
    queryFn: ({ signal }) =>
      unwrap(api.GET("/api/scenarios/{scenarioId}", { params: { path: { scenarioId } }, signal })),
    staleTime: 30_000,
  });
}
