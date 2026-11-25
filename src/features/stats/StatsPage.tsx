import { Column, Grid, SkeletonPlaceholder, Tile } from "@carbon/react";
import { lazy, Suspense, type ReactNode } from "react";
import { EmptyState, ErrorState, PageHeader } from "@/components";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useStat } from "./hooks/useStat";
import { toScoreSeries, toTtdTtrSeries } from "./lib/series";
import styles from "./StatsPage.module.scss";

// Charts are heavy (d3); they load only on this page.
const StatsChart = lazy(() => import("./StatsCharts"));

function ChartTile({
  title,
  query,
  children,
}: {
  title: string;
  query: {
    isPending: boolean;
    isError: boolean;
    error: unknown;
    refetch: () => unknown;
    empty: boolean;
  };
  children: ReactNode;
}) {
  return (
    <Tile className={styles.tile}>
      {query.isPending ? (
        <SkeletonPlaceholder className={styles.skeleton} />
      ) : query.isError ? (
        <ErrorState
          error={query.error}
          title={`Couldn't load "${title}"`}
          onRetry={() => void query.refetch()}
        />
      ) : query.empty ? (
        <EmptyState title={title} action={{ label: "Go to scenarios", to: "/scenarios" }}>
          Finish a scenario to see this chart.
        </EmptyState>
      ) : (
        <Suspense fallback={<SkeletonPlaceholder className={styles.skeleton} />}>
          {children}
        </Suspense>
      )}
    </Tile>
  );
}

/** The user's performance over their attempts (FE-106..109), from the backend's DynamoDB stats. */
export function StatsPage() {
  useDocumentTitle("Stats");
  const score = useStat("score-over-time");
  const ttdTtr = useStat("ttd-ttr-by-attempt");
  // Empty is decided on the chart data, not the rows: all-null TTD/TTR rows give no points.
  const scoreSeries = toScoreSeries(score.data ?? []);
  const ttdTtrSeries = toTtdTtrSeries(ttdTtr.data ?? []);

  return (
    <>
      <PageHeader
        title="Stats"
        description="How your score and response times change from one attempt to the next."
      />
      <Grid narrow className={styles.grid}>
        <Column sm={4} md={8} lg={8}>
          <ChartTile
            title="Score per attempt"
            query={{ ...score, empty: scoreSeries.length === 0 }}
          >
            <StatsChart kind="score" data={scoreSeries} />
          </ChartTile>
        </Column>
        <Column sm={4} md={8} lg={8}>
          <ChartTile
            title="Time to detect vs time to resolve"
            query={{ ...ttdTtr, empty: ttdTtrSeries.length === 0 }}
          >
            <StatsChart kind="ttd-ttr" data={ttdTtrSeries} />
          </ChartTile>
        </Column>
      </Grid>
    </>
  );
}
