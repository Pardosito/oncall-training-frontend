import {
  Select,
  SelectItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
} from "@carbon/react";
import { useState } from "react";
import { EmptyState, ErrorState, PageHeader, PageSkeleton } from "@/components";
import { useScenarios } from "@/features/scenarios/hooks/useScenarios";
import { formatScore } from "@/lib/format-date";
import { formatDuration } from "@/lib/format-duration";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { useLeaderboard } from "./hooks/useLeaderboard";

const HEADERS = ["Rank", "User", "Score", "Time to resolve", "Wrong actions"];

/** The only shared view (AGENTS §3): username and score of the best resolved attempts (FE-111). */
export function LeaderboardPage() {
  useDocumentTitle("Leaderboard");
  const scenarios = useScenarios();
  const [picked, setPicked] = useState<string>();
  const scenarioId = picked ?? scenarios.data?.[0]?.id;
  const board = useLeaderboard(scenarioId);

  return (
    <>
      <PageHeader title="Leaderboard" description="The best resolved attempts for each scenario." />
      {scenarios.isPending ? (
        <PageSkeleton />
      ) : scenarios.isError ? (
        <ErrorState
          error={scenarios.error}
          title="Couldn't load scenarios"
          onRetry={() => void scenarios.refetch()}
        />
      ) : !scenarioId ? (
        <EmptyState title="No scenarios yet">There's nothing to rank yet.</EmptyState>
      ) : (
        <Stack gap={6}>
          <Select
            id="leaderboard-scenario"
            labelText="Scenario"
            value={scenarioId}
            onChange={(e) => setPicked(e.target.value)}
          >
            {scenarios.data.map((s) => (
              <SelectItem key={s.id} value={s.id} text={s.title} />
            ))}
          </Select>
          {board.isPending ? (
            <PageSkeleton />
          ) : board.isError ? (
            <ErrorState
              error={board.error}
              title="Couldn't load the leaderboard"
              onRetry={() => void board.refetch()}
            />
          ) : board.data.entries.length === 0 ? (
            <EmptyState
              title="No resolved attempts yet"
              action={{ label: "Try it", to: `/scenarios/${scenarioId}` }}
            >
              Be the first to resolve this incident.
            </EmptyState>
          ) : (
            <TableContainer title="Top scores">
              <Table aria-label="Top scores" size="md">
                <TableHead>
                  <TableRow>
                    {HEADERS.map((h) => (
                      <TableHeader key={h}>{h}</TableHeader>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {board.data.entries.map((e, i) => (
                    <TableRow
                      key={`${e.rank}-${e.username}-${i}`}
                      aria-current={e.isYou ? "true" : undefined}
                    >
                      <TableCell>{e.rank}</TableCell>
                      <TableCell>
                        {e.username}{" "}
                        {e.isYou ? (
                          <Tag type="blue" size="sm">
                            You
                          </Tag>
                        ) : null}
                      </TableCell>
                      <TableCell>{formatScore(e.score)}</TableCell>
                      <TableCell>{formatDuration(e.ttrSeconds)}</TableCell>
                      <TableCell>{e.wrongActions}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      )}
    </>
  );
}
