import { act, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { ordersDown } from "@/mocks/fixtures";
import { simulator } from "@/mocks/handlers";
import { server } from "@/mocks/node";
import { RECOVERY_SECONDS } from "@/mocks/simulator";
import { renderWithProviders } from "@/test/render";
import { IncidentConsolePage } from "./IncidentConsolePage";

const routes = [
  { path: "/sessions/:sessionId", element: <IncidentConsolePage /> },
  { path: "/scenarios/:scenarioId", element: <p>Scenario detail</p> },
];

/** Moves the clock in 10 s steps, like real time would, so each poll and tick runs in order. */
async function advance(seconds: number) {
  for (let left = seconds; left > 0; left -= 10) {
    await act(() => vi.advanceTimersByTimeAsync(Math.min(10, left) * 1000));
  }
}

function serviceTile(name: string) {
  return screen.getByRole("heading", { name }).closest(".cds--tile") as HTMLElement;
}

function renderConsole() {
  const { sessionId } = simulator.start(ordersDown);
  return renderWithProviders(null, {
    routes,
    route: `/sessions/${sessionId}`,
    advanceTimers: (ms) => vi.advanceTimersByTime(ms),
  });
}

describe("incident console", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("runs the happy path: monitoring → incident → acknowledge → scale → resolved", async () => {
    const { user } = renderConsole();

    // STARTING: monitoring notice, only Acknowledge enabled.
    expect(await screen.findByText("Monitoring…")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "orders" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Scale deployment…" })).toBeDisabled();
    expect(screen.getByRole("timer")).toHaveTextContent("--:--");

    // The fault is injected after the warmup and shows up on the next polls.
    await advance(ordersDown.warmupSeconds + 5);
    await waitFor(() =>
      expect(within(serviceTile("orders")).getByText("Down")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Monitoring…")).not.toBeInTheDocument();
    expect(screen.getByText("Incident active")).toBeInTheDocument();
    expect(within(serviceTile("gateway")).getByText("Degraded")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Acknowledge" }));
    expect(await screen.findByText("Action queued: Acknowledge")).toBeInTheDocument();

    // Scale orders to 2 through the modal.
    await user.click(screen.getByRole("button", { name: "Scale deployment…" }));
    const dialog = screen.getByRole("dialog", { name: "Scale deployment" });
    const confirm = within(dialog).getByRole("button", { name: "Scale" });
    expect(confirm).toBeDisabled();
    await user.click(within(dialog).getByRole("combobox", { name: /deployment/i }));
    await user.click(within(dialog).getByRole("option", { name: "orders" }));
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    expect(await screen.findByText("Action queued: Scale orders to 2")).toBeInTheDocument();

    // No optimistic update: orders is still down until the backend sees it recover.
    expect(within(serviceTile("orders")).getByText("Down")).toBeInTheDocument();

    await advance(RECOVERY_SECONDS + 5);
    expect(
      await screen.findByRole("heading", { level: 1, name: "Incident resolved" }),
    ).toHaveFocus();
    expect(screen.getByText("Score").nextElementSibling?.textContent).toMatch(/^\d/);
    expect(screen.getByRole("link", { name: "Try again" })).toHaveAttribute(
      "href",
      "/scenarios/orders-down",
    );
    expect(screen.getByRole("link", { name: "See your stats" })).toHaveAttribute("href", "/stats");
  });

  it("shows the failed result when time runs out", async () => {
    renderConsole();
    await screen.findByText("Monitoring…");
    await advance(ordersDown.warmupSeconds + ordersDown.maxResolveSeconds + 5);
    expect(await screen.findByRole("heading", { name: "Incident failed" })).toBeInTheDocument();
    expect(screen.getByText("The time limit ran out.")).toBeInTheDocument();
  });

  it("shows not found for a session that isn't yours", async () => {
    renderWithProviders(null, { routes, route: "/sessions/someone-elses" });
    expect(await screen.findByText("Session not found")).toBeInTheDocument();
  });

  it("explains ACTION_NOT_ALLOWED with an error toast", async () => {
    const { user } = renderConsole();
    await screen.findByText("Monitoring…");
    server.use(
      http.post("*/api/sessions/:id/actions", () =>
        HttpResponse.json(
          { error: { code: "ACTION_NOT_ALLOWED", message: "x", requestId: "r" } },
          { status: 422 },
        ),
      ),
    );
    await user.click(screen.getByRole("button", { name: "Acknowledge" }));
    expect(await screen.findByText("Acknowledge failed")).toBeInTheDocument();
    expect(screen.getByText(/isn't available for this incident/i)).toBeInTheDocument();
  });

  it("refetches the session on SESSION_NOT_ACTIVE so the result view appears", async () => {
    const { user } = renderConsole();
    await screen.findByText("Monitoring…");
    let sessionCalls = 0;
    server.use(
      http.get("*/api/sessions/:id", () => {
        sessionCalls += 1;
        return undefined;
      }),
      http.post("*/api/sessions/:id/actions", () =>
        HttpResponse.json(
          { error: { code: "SESSION_NOT_ACTIVE", message: "x", requestId: "r" } },
          { status: 409 },
        ),
      ),
    );
    await user.click(screen.getByRole("button", { name: "Acknowledge" }));
    expect(await screen.findByText(/no longer active/i)).toBeInTheDocument();
    await waitFor(() => expect(sessionCalls).toBeGreaterThan(0));
  });
});
