import { useQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/api/client";
import { qk } from "@/api/query-keys";

export function useScenarios() {
  return useQuery({
    queryKey: qk.scenarios.all,
    queryFn: ({ signal }) => unwrap(api.GET("/api/scenarios", { signal })),
    staleTime: 30_000,
  });
}
