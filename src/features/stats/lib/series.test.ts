import type { ScoreRow, TtdTtrRow } from "@/api/types";
import { toScoreSeries, toTtdTtrSeries, TTD_GROUP, TTR_GROUP } from "./series";

const base = { sessionId: "01JX", scenarioId: "orders-down", endedAt: "2026-11-20T00:00:00.000Z" };

describe("toScoreSeries", () => {
  it("maps each attempt to a labeled point", () => {
    const rows: ScoreRow[] = [
      { ...base, attempt: 1, state: "FAILED", score: 0 },
      { ...base, attempt: 2, state: "RESOLVED", score: 880 },
    ];
    expect(toScoreSeries(rows)).toEqual([
      { group: "Score", key: "#1", value: 0 },
      { group: "Score", key: "#2", value: 880 },
    ]);
  });
});

describe("toTtdTtrSeries", () => {
  it("emits TTD and TTR per attempt and skips missing values instead of drawing 0", () => {
    const rows: TtdTtrRow[] = [
      { ...base, attempt: 1, state: "RESOLVED", ttdSeconds: 40, ttrSeconds: 180 },
      { ...base, attempt: 2, state: "FAILED", ttdSeconds: null, ttrSeconds: null },
      { ...base, attempt: 3, state: "FAILED", ttdSeconds: 12, ttrSeconds: null },
    ];
    expect(toTtdTtrSeries(rows)).toEqual([
      { group: TTD_GROUP, key: "#1", value: 40 },
      { group: TTR_GROUP, key: "#1", value: 180 },
      { group: TTD_GROUP, key: "#3", value: 12 },
    ]);
  });
});
