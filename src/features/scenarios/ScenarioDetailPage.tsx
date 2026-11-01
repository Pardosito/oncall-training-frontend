import { Button, Column, Grid, InlineNotification, Stack, Tag, Tile } from "@carbon/react";
import { Play } from "@carbon/icons-react";
import { useNavigate, useParams } from "react-router";
import { errorMessage } from "@/api/error-messages";
import { isApiError } from "@/api/errors";
import { EmptyState, ErrorState, PageHeader, PageSkeleton } from "@/components";
import { actionName } from "@/lib/actions";
import { formatDuration } from "@/lib/format-duration";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useScenario } from "./hooks/useScenario";
import { useStartSession } from "./hooks/useStartSession";
import styles from "./ScenarioDetailPage.module.scss";

export function ScenarioDetailPage() {
  const { scenarioId = "" } = useParams();
  const navigate = useNavigate();
  const scenario = useScenario(scenarioId);
  const start = useStartSession();
  useDocumentTitle(scenario.data?.title ?? "Scenario");

  if (scenario.isPending) return <PageSkeleton />;
  if (scenario.isError) {
    if (isApiError(scenario.error) && scenario.error.status === 404) {
      return (
        <>
          <PageHeader title="Scenario not found" />
          <EmptyState
            title="This scenario doesn't exist"
            action={{ label: "Back to scenarios", to: "/scenarios" }}
          >
            It may have been removed, or the link is wrong.
          </EmptyState>
        </>
      );
    }
    return (
      <ErrorState
        error={scenario.error}
        title="Couldn't load the scenario"
        onRetry={() => void scenario.refetch()}
      />
    );
  }

  const { title, description, maxResolveSeconds, warmupSeconds, availableActions } = scenario.data;

  function handleStart() {
    start.mutate(scenarioId, {
      onSuccess: ({ sessionId }) => void navigate(`/sessions/${sessionId}`),
    });
  }

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Button renderIcon={Play} onClick={handleStart} disabled={start.isPending}>
            {start.isPending ? "Starting…" : "Start"}
          </Button>
        }
      />
      <Stack gap={6}>
        {start.isError ? (
          <InlineNotification
            kind={isApiError(start.error) && start.error.code === "SESSION_BUSY" ? "info" : "error"}
            lowContrast
            title="Couldn't start the scenario"
            subtitle={errorMessage(start.error)}
            onClose={() => {
              start.reset();
              return false;
            }}
          />
        ) : null}
        <Grid narrow className={styles.grid}>
          <Column sm={4} md={4} lg={8}>
            <Tile className={styles.tile}>
              <h2 className={styles.heading}>How it works</h2>
              <dl className={styles.facts}>
                <dt>Warmup</dt>
                <dd>
                  About {formatDuration(warmupSeconds)} of normal traffic, then the incident begins.
                </dd>
                <dt>Time limit</dt>
                <dd>{formatDuration(maxResolveSeconds)} to resolve it once it starts.</dd>
                <dt>Scoring</dt>
                <dd>Faster detection and resolution score higher; wrong actions cost points.</dd>
              </dl>
            </Tile>
          </Column>
          <Column sm={4} md={4} lg={8}>
            <Tile className={styles.tile}>
              <h2 className={styles.heading}>Available actions</h2>
              <ul className={styles.actions}>
                {availableActions.map((type) => (
                  <li key={type}>
                    <Tag type="outline" size="md">
                      {actionName(type)}
                    </Tag>
                  </li>
                ))}
              </ul>
            </Tile>
          </Column>
        </Grid>
      </Stack>
    </>
  );
}
