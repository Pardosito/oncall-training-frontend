import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@carbon/react";
import { Link } from "react-router";
import { EmptyState, ErrorState, PageHeader, PageSkeleton, SessionStateTag } from "@/components";
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

  return (
    <>
      <PageHeader title="History" description="Every incident you've worked on, newest first." />
      {isPending ? (
        <PageSkeleton />
      ) : isError ? (
        <ErrorState
          error={error}
          title="Couldn't load your history"
          onRetry={() => void refetch()}
        />
      ) : data.length === 0 ? (
        <EmptyState title="No sessions yet" action={{ label: "Go to scenarios", to: "/scenarios" }}>
          Start a scenario and your attempts will show up here.
        </EmptyState>
      ) : (
        <>
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
                {data.map((s) => (
                  <TableRow key={s.sessionId}>
                    <TableCell>
                      <Link to={`/sessions/${s.sessionId}`}>{formatDateTime(s.createdAt)}</Link>
                    </TableCell>
                    <TableCell>{s.scenarioId}</TableCell>
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
          {hasNextPage ? (
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
