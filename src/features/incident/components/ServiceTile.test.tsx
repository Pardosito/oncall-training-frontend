import { render, screen } from "@testing-library/react";
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
});
