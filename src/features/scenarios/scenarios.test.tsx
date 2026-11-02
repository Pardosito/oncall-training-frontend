import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { renderWithProviders } from "@/test/render";
import { ScenarioDetailPage } from "./ScenarioDetailPage";
import { ScenariosPage } from "./ScenariosPage";

const routes = [
  { path: "/scenarios", element: <ScenariosPage /> },
  { path: "/scenarios/:scenarioId", element: <ScenarioDetailPage /> },
  { path: "/sessions/:sessionId", element: <p>Console for the new session</p> },
];

describe("scenarios", () => {
  it("lists scenarios and opens the detail", async () => {
    const { user } = renderWithProviders(null, { routes, route: "/scenarios" });
    const tile = await screen.findByRole("link", { name: /orders service is not responding/i });
    expect(screen.getByText("Time limit 10m 00s")).toBeInTheDocument();
    await user.click(tile);
    expect(
      await screen.findByRole("heading", { level: 1, name: /orders service/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Scale deployment")).toBeInTheDocument();
  });

  it("shows an error with retry when the list fails", async () => {
    server.use(
      http.get("*/api/scenarios", () =>
        HttpResponse.json(
          { error: { code: "INTERNAL", message: "x", requestId: "r" } },
          { status: 500 },
        ),
      ),
    );
    renderWithProviders(null, { routes, route: "/scenarios" });
    expect(await screen.findByText(/server had a problem/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("shows an empty state when there are no scenarios", async () => {
    server.use(http.get("*/api/scenarios", () => HttpResponse.json([])));
    renderWithProviders(null, { routes, route: "/scenarios" });
    expect(await screen.findByText("No scenarios yet")).toBeInTheDocument();
  });

  it("shows not found for an unknown scenario", async () => {
    renderWithProviders(null, { routes, route: "/scenarios/nope" });
    expect(await screen.findByRole("heading", { name: "Scenario not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to scenarios" })).toHaveAttribute(
      "href",
      "/scenarios",
    );
  });

  it("starts a session and navigates to the console", async () => {
    const { user } = renderWithProviders(null, { routes, route: "/scenarios/orders-down" });
    await user.click(await screen.findByRole("button", { name: "Start" }));
    expect(await screen.findByText("Console for the new session")).toBeInTheDocument();
  });

  it("disables Start while the request is pending, so it can't start twice", async () => {
    let calls = 0;
    server.use(
      http.post("*/api/sessions", async () => {
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json({ sessionId: "01JX" }, { status: 201 });
      }),
    );
    const { user } = renderWithProviders(null, { routes, route: "/scenarios/orders-down" });
    await user.click(await screen.findByRole("button", { name: "Start" }));
    const button = screen.getByRole("button", { name: "Starting…" });
    expect(button).toBeDisabled();
    await user.click(button);
    await screen.findByText("Console for the new session");
    expect(calls).toBe(1);
  });

  it("explains a busy system on 409", async () => {
    server.use(
      http.post("*/api/sessions", () =>
        HttpResponse.json(
          {
            error: {
              code: "SESSION_BUSY",
              message: "busy",
              details: { retryAfterSeconds: 360 },
              requestId: "r",
            },
          },
          { status: 409 },
        ),
      ),
    );
    const { user } = renderWithProviders(null, { routes, route: "/scenarios/orders-down" });
    await user.click(await screen.findByRole("button", { name: "Start" }));
    expect(
      await screen.findByText(/another engineer is handling an incident/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Start" })).toBeEnabled();
  });
});
