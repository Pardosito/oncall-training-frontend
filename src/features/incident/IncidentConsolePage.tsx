import { Column, Grid, InlineNotification, Stack } from "@carbon/react";
import { useParams } from "react-router";
import { isApiError } from "@/api/errors";
import { EmptyState, ErrorState, PageSkeleton } from "@/components";
import { useScenario } from "@/features/scenarios";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { ActionPanel } from "./components/ActionPanel";
import { ConsoleHeader } from "./components/ConsoleHeader";
import { EventTimeline } from "./components/EventTimeline";
import { ResultView } from "./components/ResultView";
import { ServiceTile } from "./components/ServiceTile";
import { useDashboard } from "./hooks/useDashboard";
import { useSendAction } from "./hooks/useSendAction";
import { useSession } from "./hooks/useSession";
import { actionPanelModel } from "./lib/enabled-actions";
import { isTerminal } from "./lib/session";
import styles from "./IncidentConsolePage.module.scss";

/** Console while the session runs, result view once it's terminal, same route (DECISIONS D-17). */
export function IncidentConsolePage() {
  const { sessionId = "" } = useParams();
  const session = useSession(sessionId);
  const terminal = isTerminal(session.data?.state);
  const dashboard = useDashboard(sessionId, { active: session.isSuccess && !terminal });
  const scenario = useScenario(session.data?.scenarioId ?? "");
  const send = useSendAction(sessionId);
  const title = scenario.data?.title ?? "Incident";
  useDocumentTitle(terminal ? "Result" : "Incident console");

  if (session.isPending) return <PageSkeleton />;
  if (session.isError) {
    // 404 also covers someone else's session: the backend never reveals it exists.
    if (isApiError(session.error) && session.error.status === 404) {
      return (
        <EmptyState
          title="Session not found"
          action={{ label: "Go to scenarios", to: "/scenarios" }}
        >
          It doesn't exist, or it isn't yours.
        </EmptyState>
      );
    }
    return (
      <ErrorState
        error={session.error}
        title="Couldn't load the session"
        onRetry={() => void session.refetch()}
      />
    );
  }

  const snapshot = dashboard.data;
  if (terminal) {
    return (
      <ResultView title={title} session={session.data} events={snapshot?.recentEvents ?? []} />
    );
  }

  const model = actionPanelModel({
    state: session.data.state,
    availableActions: snapshot?.availableActions ?? scenario.data?.availableActions ?? [],
    services: snapshot?.services.map((s) => s.name) ?? [],
    pending: send.isPending && send.variables ? [send.variables.type] : [],
  });

  return (
    <>
      <ConsoleHeader title={title} session={session.data} />
      <Stack gap={5}>
        {session.data.state === "STARTING" ? (
          <InlineNotification
            kind="info"
            lowContrast
            hideCloseButton
            title="Monitoring…"
            subtitle="The incident will begin shortly. Watch the services."
          />
        ) : null}
        <Grid narrow className={styles.grid}>
          <Column sm={4} md={8} lg={11}>
            <section aria-labelledby="services-heading">
              <h2 id="services-heading" className={styles.heading}>
                Services
              </h2>
              {snapshot ? (
                <Stack gap={3}>
                  {snapshot.services.map((service) => (
                    <ServiceTile key={service.name} service={service} />
                  ))}
                </Stack>
              ) : dashboard.isError ? (
                <ErrorState
                  error={dashboard.error}
                  title="Live data unavailable"
                  onRetry={() => void dashboard.refetch()}
                />
              ) : (
                <PageSkeleton />
              )}
            </section>
          </Column>
          <Column sm={4} md={8} lg={5}>
            <ActionPanel model={model} onAction={(action) => send.mutate(action)} />
          </Column>
          <Column sm={4} md={8} lg={16}>
            <section aria-labelledby="events-heading" className={styles.events}>
              <h2 id="events-heading" className={styles.heading}>
                Events
              </h2>
              <EventTimeline events={snapshot?.recentEvents ?? []} />
            </section>
          </Column>
        </Grid>
      </Stack>
    </>
  );
}
