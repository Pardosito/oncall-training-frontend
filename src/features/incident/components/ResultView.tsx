import { Button, Column, Grid, Stack, Tile } from "@carbon/react";
import { useEffect, useRef } from "react";
import { Link } from "react-router";
import type { DashboardEvent, SessionView } from "@/api/types";
import { formatDuration } from "@/lib/format-duration";
import { formatScore } from "@/lib/format-date";
import { EventTimeline } from "./EventTimeline";
import styles from "./ResultView.module.scss";

const FAILURE_REASONS = {
  TIMEOUT: "The time limit ran out.",
  ABANDONED: "The incident was abandoned.",
  ERROR: "The session ended because of an error.",
} as const;

type Props = {
  title: string;
  session: SessionView;
  events: readonly DashboardEvent[];
};

/** Outcome, score and the full timeline once the session ends (ARCHITECTURE §5, FE-092). */
export function ResultView({ title, session, events }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const resolved = session.state === "RESOLVED";

  // The console switches to this view on its own, so move focus to say what happened.
  useEffect(() => headingRef.current?.focus(), []);

  const stats = [
    { label: "Score", value: resolved ? formatScore(session.score) : "—" },
    { label: "Time to detect", value: formatDuration(session.ttdSeconds) },
    { label: "Time to resolve", value: formatDuration(session.ttrSeconds) },
    { label: "Wrong actions", value: String(session.wrongActions ?? 0) },
    {
      label: "Actions",
      value: session.actionsCount === undefined ? "—" : String(session.actionsCount),
    },
  ];

  return (
    <Stack gap={7} className={styles.result}>
      <div>
        <p className={styles.eyebrow}>{title}</p>
        <h1 ref={headingRef} tabIndex={-1} className={styles.outcome}>
          {resolved ? "Incident resolved" : "Incident failed"}
        </h1>
        {!resolved && session.failureReason ? (
          <p className={styles.reason}>{FAILURE_REASONS[session.failureReason]}</p>
        ) : null}
      </div>
      <Grid narrow className={styles.grid}>
        {stats.map(({ label, value }) => (
          <Column key={label} sm={2} md={2} lg={3}>
            <Tile className={styles.stat}>
              <p className={styles.label}>{label}</p>
              <p className={styles.value}>{value}</p>
            </Tile>
          </Column>
        ))}
      </Grid>
      <div className={styles.buttons}>
        <Button as={Link} to={`/scenarios/${session.scenarioId}`}>
          Try again
        </Button>
        <Button as={Link} to="/stats" kind="tertiary">
          See your stats
        </Button>
      </div>
      <section>
        <h2 className={styles.heading}>Timeline</h2>
        <EventTimeline events={events} limit={Infinity} />
      </section>
    </Stack>
  );
}
