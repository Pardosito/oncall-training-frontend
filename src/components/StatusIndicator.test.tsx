import { render, screen } from "@testing-library/react";
import { StatusIndicator, type Status } from "./StatusIndicator";

describe("StatusIndicator", () => {
  it.each<[Status, string]>([
    ["healthy", "Healthy"],
    ["degraded", "Degraded"],
    ["down", "Down"],
    ["unknown", "Unknown"],
    ["stale", "Stale"],
  ])("always shows a text label for %s", (status, label) => {
    render(<StatusIndicator status={status} />);
    expect(screen.getByText(label)).toBeVisible();
  });
});
