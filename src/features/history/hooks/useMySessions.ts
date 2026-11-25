import { useInfiniteQuery } from "@tanstack/react-query";
import { api, unwrap } from "@/api/client";
import { qk } from "@/api/query-keys";

export const HISTORY_PAGE_SIZE = 20;

/** The signed-in user's sessions, newest first, one cursor page at a time (FE-098). */
export function useMySessions() {
  return useInfiniteQuery({
    queryKey: qk.me.sessions,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      unwrap(
        api.GET("/api/me/sessions", {
          params: {
            query: { limit: HISTORY_PAGE_SIZE, ...(pageParam ? { cursor: pageParam } : {}) },
          },
          signal,
        }),
      ),
    getNextPageParam: (last) => last.nextCursor,
    select: (data) => data.pages.flatMap((page) => page.items),
    staleTime: 15_000,
  });
}
