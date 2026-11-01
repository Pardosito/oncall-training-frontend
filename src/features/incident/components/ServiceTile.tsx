import { Tile } from "@carbon/react";
import type { ServiceStatus } from "@/api/types";
import { StatusIndicator } from "@/components";
import styles from "./ServiceTile.module.scss";

/** One mock service: health, ready/desired replicas and latency. Props only (FE-078). */
export function ServiceTile({ service }: { service: ServiceStatus }) {
  const { name, health, readyReplicas, desiredReplicas, latencyMs } = service;
  return (
    <Tile className={styles.tile}>
      <h3 className={styles.name}>{name}</h3>
      <StatusIndicator status={health} />
      <dl className={styles.metrics}>
        <dt>Ready</dt>
        <dd className={styles.mono}>
          {readyReplicas}/{desiredReplicas}
        </dd>
        <dt>Latency</dt>
        <dd className={styles.mono}>
          {latencyMs === undefined ? "—" : `${Math.round(latencyMs)} ms`}
        </dd>
      </dl>
    </Tile>
  );
}
