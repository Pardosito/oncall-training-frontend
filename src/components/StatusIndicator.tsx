import {
  CheckmarkFilled,
  CircleDash,
  ErrorFilled,
  Help,
  WarningAltFilled,
} from "@carbon/icons-react";
import type { ServiceHealth } from "@/api/types";
import styles from "./StatusIndicator.module.scss";

export type Status = ServiceHealth | "unknown" | "stale";

const STATUS = {
  healthy: { label: "Healthy", Icon: CheckmarkFilled, className: styles.healthy },
  degraded: { label: "Degraded", Icon: WarningAltFilled, className: styles.degraded },
  down: { label: "Down", Icon: ErrorFilled, className: styles.down },
  unknown: { label: "Unknown", Icon: Help, className: styles.muted },
  stale: { label: "Stale", Icon: CircleDash, className: styles.muted },
} as const;

/** Health is always icon + text + color, never color alone (CONVENTIONS §5.6, ARCHITECTURE §5). */
export function StatusIndicator({ status }: { status: Status }) {
  const { label, Icon, className } = STATUS[status];
  return (
    <span className={`${styles.indicator} ${className}`}>
      <Icon aria-hidden="true" size={16} />
      <span>{label}</span>
    </span>
  );
}
