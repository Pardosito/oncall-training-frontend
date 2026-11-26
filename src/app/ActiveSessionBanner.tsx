import { ActionableNotification } from "@carbon/react";
import { useLocation, useNavigate } from "react-router";
import { useMySessions } from "@/features/history";
import styles from "./AppShell.module.scss";

/**
 * FE-096: while the user has a session running, every other page shows a way back to it.
 * Reads the first page of the user's history (newest first); hidden on the session's own page.
 */
export function ActiveSessionBanner() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const sessions = useMySessions();
  const active = sessions.data?.find(
    (s) => s.state === "STARTING" || s.state === "INCIDENT_ACTIVE",
  );
  if (!active) return null;
  const path = `/sessions/${active.sessionId}`;
  if (pathname === path) return null;

  return (
    <ActionableNotification
      className={styles.banner}
      kind="info"
      inline
      lowContrast
      hideCloseButton
      title="Your incident is still running"
      subtitle="The clock keeps going while you're away."
      actionButtonLabel="Return to incident"
      onActionButtonClick={() => void navigate(path)}
    />
  );
}
