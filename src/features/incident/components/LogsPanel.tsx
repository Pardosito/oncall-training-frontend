import { Button, CodeSnippet, Dropdown, InlineNotification, Stack, Tile } from "@carbon/react";
import { Renew, Terminal } from "@carbon/icons-react";
import { useState } from "react";
import { errorMessage } from "@/api/error-messages";
import { useLogs } from "../hooks/useLogs";
import styles from "./LogsPanel.module.scss";

type Props = {
  sessionId: string;
  services: readonly string[];
  /** INCIDENT_ACTIVE only: the backend answers 409 otherwise. */
  enabled: boolean;
};

/** Pick a service, read its last log lines (FE-088). Only rendered when VIEW_LOGS is available. */
export function LogsPanel({ sessionId, services, enabled }: Props) {
  const [selected, setSelected] = useState<string | null>(services[0] ?? null);
  const [requested, setRequested] = useState<string | null>(null);
  const logs = useLogs(sessionId, requested);

  function view() {
    if (selected === null) return;
    if (selected === requested) void logs.refetch();
    else setRequested(selected);
  }

  return (
    <Tile className={styles.panel}>
      <Stack gap={5}>
        <h2 className={styles.heading}>Logs</h2>
        <div className={styles.controls}>
          <Dropdown
            id={`logs-service-${sessionId}`}
            titleText="Service"
            label="Choose a service"
            size="md"
            items={[...services]}
            selectedItem={selected}
            onChange={({ selectedItem }) => setSelected(selectedItem ?? null)}
            disabled={!enabled}
          />
          <Button
            kind="tertiary"
            size="md"
            renderIcon={requested !== null && requested === selected ? Renew : Terminal}
            disabled={!enabled || selected === null || logs.isFetching}
            onClick={view}
          >
            {logs.isFetching
              ? "Loading…"
              : requested !== null && requested === selected
                ? "Refresh"
                : "View logs"}
          </Button>
        </div>
        {logs.isError ? (
          <InlineNotification
            kind="error"
            lowContrast
            hideCloseButton
            title="Couldn't load the logs"
            subtitle={errorMessage(logs.error)}
          />
        ) : null}
        {logs.data ? (
          logs.data.lines.length === 0 ? (
            <p className={styles.empty}>No log lines for {logs.data.service} yet.</p>
          ) : (
            <CodeSnippet
              type="multi"
              className={styles.lines}
              aria-label={`Last ${logs.data.lines.length} log lines of ${logs.data.service}`}
              feedback="Copied"
              maxCollapsedNumberOfRows={12}
              maxExpandedNumberOfRows={40}
            >
              {logs.data.lines.join("\n")}
            </CodeSnippet>
          )
        ) : null}
      </Stack>
    </Tile>
  );
}
