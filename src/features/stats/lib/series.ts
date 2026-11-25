import type { ScoreRow, TtdTtrRow } from "@/api/types";

/** One point of a Carbon chart's tabular data. */
export type ChartPoint = { group: string; key: string; value: number };

export const attemptLabel = (attempt: number) => `#${attempt}`;

/** Score per attempt, for the LineChart (FE-103). */
export function toScoreSeries(rows: readonly ScoreRow[]): ChartPoint[] {
  return rows.map((r) => ({ group: "Score", key: attemptLabel(r.attempt), value: r.score }));
}

export const TTD_GROUP = "Time to detect";
export const TTR_GROUP = "Time to resolve";

/**
 * TTD and TTR in seconds per attempt, for the GroupedBarChart (FE-104). A missing value (never
 * acknowledged, not resolved) is left out instead of drawn as 0, so it doesn't read as instant.
 */
export function toTtdTtrSeries(rows: readonly TtdTtrRow[]): ChartPoint[] {
  return rows.flatMap((r) => {
    const key = attemptLabel(r.attempt);
    const points: ChartPoint[] = [];
    if (r.ttdSeconds !== null) points.push({ group: TTD_GROUP, key, value: r.ttdSeconds });
    if (r.ttrSeconds !== null) points.push({ group: TTR_GROUP, key, value: r.ttrSeconds });
    return points;
  });
}
