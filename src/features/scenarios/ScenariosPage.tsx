import { ClickableTile, Column, Grid, Stack, Tag } from "@carbon/react";
import { EmptyState, ErrorState, PageHeader, PageSkeleton } from "@/components";
import { formatDuration } from "@/lib/format-duration";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useSpaLinkClick } from "@/lib/useSpaLinkClick";
import { useScenarios } from "./hooks/useScenarios";
import styles from "./ScenariosPage.module.scss";

export function ScenariosPage() {
  useDocumentTitle("Scenarios");
  const { data, isPending, isError, error, refetch } = useScenarios();
  const linkClick = useSpaLinkClick();

  return (
    <>
      <PageHeader
        title="Scenarios"
        description="Pick an incident to practice. A fault is injected into a live system, and you fix it from the console."
      />
      {isPending ? (
        <PageSkeleton />
      ) : isError ? (
        <ErrorState error={error} title="Couldn't load scenarios" onRetry={() => void refetch()} />
      ) : data.length === 0 ? (
        <EmptyState title="No scenarios yet">
          Scenarios will show up here once they're published.
        </EmptyState>
      ) : (
        <Grid narrow className={styles.grid}>
          {data.map((scenario) => (
            <Column key={scenario.id} sm={4} md={4} lg={8}>
              <ClickableTile
                href={`/scenarios/${scenario.id}`}
                onClick={linkClick(`/scenarios/${scenario.id}`)}
                className={styles.tile}
              >
                <Stack gap={4}>
                  <h2 className={styles.title}>{scenario.title}</h2>
                  <p className={styles.description}>{scenario.description}</p>
                  <div>
                    <Tag type="cool-gray" size="sm">
                      Time limit {formatDuration(scenario.maxResolveSeconds)}
                    </Tag>
                  </div>
                </Stack>
              </ClickableTile>
            </Column>
          ))}
        </Grid>
      )}
    </>
  );
}
