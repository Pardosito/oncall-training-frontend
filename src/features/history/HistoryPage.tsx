import {
  Button,
  InlineNotification,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@carbon/react";
import { Link } from "react-router";
import { errorMessage } from "@/api/error-messages";
import { EmptyState, ErrorState, PageHeader, PageSkeleton, SessionStateTag } from "@/components";
import { useScenarios } from "@/features/scenarios";
import { formatDateTime, formatScore } from "@/lib/format-date";
import { formatDuration } from "@/lib/format-duration";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useMySessions } from "./hooks/useMySessions";

const HEADERS = [
  "Started",
  "Scenario",
  "Result",
  "Score",
  "Time to detect",
  "Time to resolve",
  "Wrong actions",
];

/** The user's own attempts (FE-099..101). Each row opens the session's console/result view. */
export function HistoryPage() {
  useDocumentTitle("History");
  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useMySessions();
  const scenarios = useScenarios();
  // Falls back to the id while scenarios load or when one is no longer listed.
  const titles = new Map((scenarios.data ?? []).map((s) => [s.id, s.title]));
  const rows = data ?? [];

  return (
    <>
      <PageHeader title="History" description="Every incident you've worked on, newest first." />
      {isPending ? (
        <PageSkeleton />
      ) : isError && data === undefined ? (
        // Only the first page failed: nothing to show, so the page-level error replaces it.
        <ErrorState
          error={error}
          title="Couldn't load your history"
          onRetry={() => void refetch()}
        />
      ) : rows.length === 0 ? (
        <EmptyState title="No sessions yet" action={{ label: "Go to scenarios", to: "/scenarios" }}>
          Start a scenario and your attempts will show up here.
        </EmptyState>
      ) : (
        <>
          {isError ? (
            // A later page failed: keep the loaded rows and offer Retry for the same page.
            <Stack gap={4}>
              <InlineNotification
                kind="error"
                lowContrast
                hideCloseButton
                title="Couldn't load more sessions"
                subtitle={errorMessage(error)}
              />
              <div>
                <Button
                  kind="secondary"
                  size="md"
                  disabled={isFetchingNextPage}
                  onClick={() => void fetchNextPage()}
                >
                  Retry
                </Button>
              </div>
            </Stack>
          ) : null}
          <TableContainer title="Your sessions">
            <Table aria-label="Your sessions" size="md">
              <TableHead>
                <TableRow>
                  {HEADERS.map((h) => (
                    <TableHeader key={h}>{h}</TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((s) => (
                  <TableRow key={s.sessionId}>
                    <TableCell>
                      <Link to={`/sessions/${s.sessionId}`}>{formatDateTime(s.createdAt)}</Link>
                    </TableCell>
                    <TableCell>{titles.get(s.scenarioId) ?? s.scenarioId}</TableCell>
                    <TableCell>
                      <SessionStateTag state={s.state} />
                    </TableCell>
                    <TableCell>{formatScore(s.score)}</TableCell>
                    <TableCell>{formatDuration(s.ttdSeconds)}</TableCell>
                    <TableCell>{formatDuration(s.ttrSeconds)}</TableCell>
                    <TableCell>{s.wrongActions ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {hasNextPage && !isError ? (
            <Button
              kind="tertiary"
              size="md"
              disabled={isFetchingNextPage}
              onClick={() => void fetchNextPage()}
            >
              {isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          ) : null}
        </>
      )}
    </>
  );
}
