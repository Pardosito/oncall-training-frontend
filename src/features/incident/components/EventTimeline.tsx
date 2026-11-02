import type { DashboardEvent } from "@/api/types";
import { formatRelative, formatTime } from "@/lib/format-date";
import styles from "./EventTimeline.module.scss";

type Props = {
  events: readonly DashboardEvent[];
  /** Cap on rendered events; the console shows the last 20 (ARCHITECTURE §5). */
  limit?: number;
  now?: Date;
};

/** Newest first. Event text is rendered as plain text (CONVENTIONS §12). */
export function EventTimeline({ events, limit = 20, now = new Date() }: Props) {
  const sorted = [...events].sort((a, b) => Date.parse(b.ts) - Date.parse(a.ts)).slice(0, limit);
  if (sorted.length === 0) return <p className={styles.empty}>No events yet.</p>;
  return (
    <ol className={styles.list} aria-label="Event timeline">
      {sorted.map((event) => (
        <li key={`${event.ts}-${event.type}`} className={styles.item}>
          <time dateTime={event.ts} className={styles.time}>
            {formatTime(event.ts)}
          </time>
          <span className={styles.summary}>{event.summary}</span>
          <span className={styles.relative}>{formatRelative(event.ts, now)}</span>
        </li>
      ))}
    </ol>
  );
}
