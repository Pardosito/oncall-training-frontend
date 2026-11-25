import {
  GroupedBarChart,
  LineChart,
  ScaleTypes,
  type BarChartOptions,
  type LineChartOptions,
} from "@carbon/charts-react";
import "@carbon/charts-react/styles.css";
import type { ChartPoint } from "./lib/series";

// Carbon Charts (AGENTS §4), g100 like the rest of the app. The toolbar's "Show as table" is the
// accessible alternative to each chart (FE-108).
const common = { theme: "g100", height: "320px", toolbar: { enabled: true } } as const;

export function ScoreOverTimeChart({ data }: { data: ChartPoint[] }) {
  const options: LineChartOptions = {
    ...common,
    title: "Score per attempt",
    axes: {
      bottom: { title: "Attempt", mapsTo: "key", scaleType: ScaleTypes.LABELS },
      left: { title: "Score", mapsTo: "value", scaleType: ScaleTypes.LINEAR },
    },
    legend: { enabled: false },
  };
  return <LineChart data={data} options={options} />;
}

export function TtdTtrChart({ data }: { data: ChartPoint[] }) {
  const options: BarChartOptions = {
    ...common,
    title: "Time to detect vs time to resolve (seconds)",
    axes: {
      bottom: { title: "Attempt", mapsTo: "key", scaleType: ScaleTypes.LABELS },
      left: { title: "Seconds", mapsTo: "value", scaleType: ScaleTypes.LINEAR },
    },
  };
  return <GroupedBarChart data={data} options={options} />;
}

/** One entry point, so the page lazy-loads a single module. */
export default function StatsChart({
  kind,
  data,
}: {
  kind: "score" | "ttd-ttr";
  data: ChartPoint[];
}) {
  return kind === "score" ? <ScoreOverTimeChart data={data} /> : <TtdTtrChart data={data} />;
}
