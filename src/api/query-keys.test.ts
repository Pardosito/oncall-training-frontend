import { QueryClient } from "@tanstack/react-query";
import { qk } from "./query-keys";

describe("qk", () => {
  it("nests the dashboard under its session", () => {
    expect(qk.sessions.dashboard("s1").slice(0, 2)).toEqual(qk.sessions.detail("s1"));
  });

  it("invalidates every stat and leaderboard with the prefix keys", async () => {
    const client = new QueryClient();
    client.setQueryData(qk.me.stats("score-over-time"), 1);
    client.setQueryData(qk.leaderboard("orders-down"), 1);
    await client.invalidateQueries({ queryKey: qk.me.stats() });
    await client.invalidateQueries({ queryKey: qk.leaderboard() });
    expect(client.getQueryState(qk.me.stats("score-over-time"))?.isInvalidated).toBe(true);
    expect(client.getQueryState(qk.leaderboard("orders-down"))?.isInvalidated).toBe(true);
  });
});
