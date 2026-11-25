import { screen, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { renderWithProviders } from "@/test/render";
import { HistoryPage } from "./history";
import { LeaderboardPage } from "./leaderboard";
import { StatsPage } from "./stats";

// Carbon Charts draw SVG with d3 and need layout jsdom doesn't have; the mappers are tested apart.
vi.mock("./stats/StatsCharts", () => ({
  default: ({ kind, data }: { kind: string; data: unknown[] }) => (
    <p>{`${kind} chart: ${data.length} points`}</p>
  ),
}));

describe("HistoryPage", () => {
  it("lists the user's sessions with a link to each", async () => {
    renderWithProviders(<HistoryPage />);
    const table = await screen.findByRole("table", { name: "Your sessions" });
    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(4); // header + 3 sessions
    expect(within(rows[1]!).getByRole("link")).toHaveAttribute(
      "href",
      "/sessions/01JHISTORY0000000000000003",
    );
    expect(within(table).getAllByText("Resolved").length).toBeGreaterThan(0);
  });

  it("shows the empty state without sessions", async () => {
    server.use(http.get("*/api/me/sessions", () => HttpResponse.json({ items: [] })));
    renderWithProviders(<HistoryPage />);
    expect(await screen.findByText("No sessions yet")).toBeInTheDocument();
  });

  it("loads the next page", async () => {
    server.use(
      http.get("*/api/me/sessions", ({ request }) => {
        const cursor = new URL(request.url).searchParams.get("cursor");
        return HttpResponse.json(
          cursor
            ? {
                items: [
                  {
                    sessionId: "01JHISTORY0000000000000009",
                    scenarioId: "orders-down",
                    state: "FAILED",
                    createdAt: "2026-11-01T00:00:00.000Z",
                  },
                ],
              }
            : {
                items: [
                  {
                    sessionId: "01JHISTORY0000000000000010",
                    scenarioId: "orders-down",
                    state: "RESOLVED",
                    createdAt: "2026-11-02T00:00:00.000Z",
                  },
                ],
                nextCursor: "01JHISTORY0000000000000010",
              },
        );
      }),
    );
    const { user } = renderWithProviders(<HistoryPage />);
    await user.click(await screen.findByRole("button", { name: "Load more" }));
    expect(await screen.findAllByRole("row")).toHaveLength(3);
    expect(screen.queryByRole("button", { name: "Load more" })).not.toBeInTheDocument();
  });
});

describe("HistoryPage errors", () => {
  it("keeps the loaded rows and shows an inline error with Retry when a later page fails", async () => {
    let page2Fails = true;
    server.use(
      http.get("*/api/me/sessions", ({ request }) => {
        const cursor = new URL(request.url).searchParams.get("cursor");
        if (cursor) {
          return page2Fails
            ? HttpResponse.json({}, { status: 500 })
            : HttpResponse.json({
                items: [
                  {
                    sessionId: "01JHISTORY0000000000000009",
                    scenarioId: "orders-down",
                    state: "FAILED",
                    createdAt: "2026-11-01T00:00:00.000Z",
                  },
                ],
              });
        }
        return HttpResponse.json({
          items: [
            {
              sessionId: "01JHISTORY0000000000000010",
              scenarioId: "orders-down",
              state: "RESOLVED",
              createdAt: "2026-11-02T00:00:00.000Z",
            },
          ],
          nextCursor: "01JHISTORY0000000000000010",
        });
      }),
    );
    const { user } = renderWithProviders(<HistoryPage />);
    await user.click(await screen.findByRole("button", { name: "Load more" }));

    expect(await screen.findByText("Couldn't load more sessions")).toBeInTheDocument();
    const table = screen.getByRole("table", { name: "Your sessions" });
    expect(within(table).getAllByRole("row")).toHaveLength(2); // header + first page
    expect(within(table).getByText("Resolved")).toBeInTheDocument();
    expect(screen.queryByText("Couldn't load your history")).not.toBeInTheDocument();

    page2Fails = false;
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await within(table).findAllByRole("row")).toHaveLength(3);
    expect(screen.queryByText("Couldn't load more sessions")).not.toBeInTheDocument();
  });

  it("shows the page error when the first page fails", async () => {
    server.use(http.get("*/api/me/sessions", () => HttpResponse.json({}, { status: 500 })));
    renderWithProviders(<HistoryPage />);
    expect(await screen.findByText("Couldn't load your history")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows the scenario title instead of its id", async () => {
    renderWithProviders(<HistoryPage />);
    const table = await screen.findByRole("table", { name: "Your sessions" });
    expect(within(table).getAllByText("Orders service is not responding").length).toBeGreaterThan(
      0,
    );
    expect(within(table).queryByText("orders-down")).not.toBeInTheDocument();
  });
});

describe("StatsPage", () => {
  it("renders both charts from the stats endpoints", async () => {
    renderWithProviders(<StatsPage />);
    expect(await screen.findByText("score chart: 3 points")).toBeInTheDocument();
    // Attempt 1: TTD + TTR, attempt 2: nothing (failed, never acknowledged), attempt 3: TTD + TTR.
    expect(await screen.findByText("ttd-ttr chart: 4 points")).toBeInTheDocument();
  });

  it("shows an empty state per chart without ended attempts", async () => {
    server.use(
      http.get<{ queryName: string }>("*/api/me/stats/:queryName", ({ params }) =>
        HttpResponse.json({ query: params.queryName, rows: [] }),
      ),
    );
    renderWithProviders(<StatsPage />);
    expect(await screen.findAllByText("Finish a scenario to see this chart.")).toHaveLength(2);
  });
});

describe("StatsPage errors", () => {
  it("shows the error state for a chart whose request fails", async () => {
    server.use(
      http.get("*/api/me/stats/score-over-time", () => HttpResponse.json({}, { status: 500 })),
    );
    renderWithProviders(<StatsPage />);
    expect(await screen.findByText('Couldn\'t load "Score per attempt"')).toBeInTheDocument();
    expect(await screen.findByText("ttd-ttr chart: 4 points")).toBeInTheDocument();
  });

  it("shows the empty state when every TTD and TTR is null", async () => {
    server.use(
      http.get("*/api/me/stats/ttd-ttr-by-attempt", () =>
        HttpResponse.json({
          query: "ttd-ttr-by-attempt",
          rows: [
            {
              attempt: 1,
              sessionId: "01JHISTORY0000000000000003",
              scenarioId: "orders-down",
              endedAt: "2026-11-18T16:03:10.000Z",
              state: "FAILED",
              ttdSeconds: null,
              ttrSeconds: null,
            },
          ],
        }),
      ),
    );
    renderWithProviders(<StatsPage />);
    expect(await screen.findByText("score chart: 3 points")).toBeInTheDocument();
    expect(await screen.findByText("Finish a scenario to see this chart.")).toBeInTheDocument();
    expect(screen.queryByText(/ttd-ttr chart/)).not.toBeInTheDocument();
  });
});

describe("LeaderboardPage", () => {
  it("ranks the entries and marks the user's row", async () => {
    renderWithProviders(<LeaderboardPage />);
    const table = await screen.findByRole("table", { name: "Top scores" });
    const mine = within(table).getByText("You").closest("tr");
    expect(mine).toHaveAttribute("aria-current", "true");
    expect(within(mine!).getByText("alice")).toBeInTheDocument();
  });
});

describe("LeaderboardPage states", () => {
  it("shows the empty state when nobody has resolved the scenario", async () => {
    server.use(
      http.get("*/api/leaderboard/:scenarioId", ({ params }) =>
        HttpResponse.json({ scenarioId: params.scenarioId, entries: [] }),
      ),
    );
    renderWithProviders(<LeaderboardPage />);
    expect(await screen.findByText("No resolved attempts yet")).toBeInTheDocument();
    expect(screen.queryByRole("table", { name: "Top scores" })).not.toBeInTheDocument();
  });

  it("shows the error state when the leaderboard request fails", async () => {
    server.use(
      http.get("*/api/leaderboard/:scenarioId", () => HttpResponse.json({}, { status: 500 })),
    );
    renderWithProviders(<LeaderboardPage />);
    expect(await screen.findByText("Couldn't load the leaderboard")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
