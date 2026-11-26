import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ServiceTile } from "./ServiceTile";

describe("ServiceTile", () => {
  it("shows name, health, replicas and latency", () => {
    render(
      <ServiceTile
        service={{
          name: "gateway",
          health: "degraded",
          readyReplicas: 1,
          desiredReplicas: 1,
          latencyMs: 950.4,
          pods: [],
        }}
      />,
    );
    expect(screen.getByRole("heading", { name: "gateway" })).toBeInTheDocument();
    expect(screen.getByText("Degraded")).toBeInTheDocument();
    expect(screen.getByText("1/1")).toBeInTheDocument();
    expect(screen.getByText("950 ms")).toBeInTheDocument();
  });

  it("shows a dash without latency", () => {
    render(
      <ServiceTile
        service={{ name: "orders", health: "down", readyReplicas: 0, desiredReplicas: 0, pods: [] }}
      />,
    );
    expect(screen.getByText("Down")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("lists the pods when expanded (FE-079)", async () => {
    const user = userEvent.setup();
    render(
      <ServiceTile
        service={{
          name: "orders",
          health: "healthy",
          readyReplicas: 1,
          desiredReplicas: 1,
          pods: [
            { name: "orders-abc12", phase: "Running", ready: true, restarts: 2, ageSeconds: 95 },
          ],
        }}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Pods (1)" }));
    const table = screen.getByRole("table", { name: "Pods of orders" });
    expect(table).toHaveTextContent("orders-abc12");
    expect(table).toHaveTextContent("Running");
    expect(table).toHaveTextContent("1m 35s");
  });

  it("says so when no pods are running", async () => {
    const user = userEvent.setup();
    render(
      <ServiceTile
        service={{ name: "orders", health: "down", readyReplicas: 0, desiredReplicas: 0, pods: [] }}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Pods (0)" }));
    expect(screen.getByText("No pods are running.")).toBeInTheDocument();
  });
});
