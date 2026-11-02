import { useEffect, useState } from "react";
import { formatClock } from "@/lib/format-duration";
import styles from "./IncidentTimer.module.scss";

type Props = {
  /** When the fault was injected; before that the timer shows --:--. */
  faultInjectedAt?: string;
  /** When the session ended; the timer freezes there. */
  endedAt?: string;
};

/** mm:ss since the fault. Display only, never sent to the backend (ARCHITECTURE §5). */
export function IncidentTimer({ faultInjectedAt, endedAt }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const running = faultInjectedAt !== undefined && endedAt === undefined;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running]);

  let text = "--:--";
  if (faultInjectedAt) {
    const end = endedAt ? Date.parse(endedAt) : now;
    text = formatClock((end - Date.parse(faultInjectedAt)) / 1000);
  }

  return (
    <span
      className={styles.timer}
      role="timer"
      aria-live="off"
      aria-label={`Incident time ${text}`}
    >
      {text}
    </span>
  );
}
