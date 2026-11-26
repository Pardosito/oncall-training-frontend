import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import type { MySessionsResponse } from "@/api/types";
import { server } from "@/mocks/node";
import { renderWithProviders } from "@/test/render";
import { AppShell } from "./AppShell";

const routes = [
  {
    path: "/",
    element: <AppShell />,
    children: [
      { path: "history", element: <p>History page</p> },
      { path: "sessions/:sessionId", element: <p>Console page</p> },
    ],
  },
];

function mySessions(state: "INCIDENT_ACTIVE" | "RESOLVED") {
  const body: MySessionsResponse = {
    items: [
      {
        sessionId: "01JACTIVE",
        scenarioId: "orders-down",
        state,
        createdAt: "2026-11-26T10:00:00.000Z",
        wrongActions: 0,
        actionsCount: 0,
      },
    ],
  };
  server.use(http.get("*/api/me/sessions", () => HttpResponse.json(body)));
}

describe("Return to incident banner (FE-096)", () => {
  it("links back to a running session from other pages", async () => {
    mySessions("INCIDENT_ACTIVE");
    const { user, router } = renderWithProviders(null, { routes, route: "/history" });
    await user.click(await screen.findByRole("button", { name: "Return to incident" }));
    expect(router.state.location.pathname).toBe("/sessions/01JACTIVE");
    expect(screen.getByText("Console page")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Return to incident" })).not.toBeInTheDocument();
  });

  it("stays hidden when nothing is running", async () => {
    mySessions("RESOLVED");
    renderWithProviders(null, { routes, route: "/history" });
    expect(await screen.findByText("History page")).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(screen.queryByText("Your incident is still running")).not.toBeInTheDocument();
  });
});
