import { render, screen, within } from "@testing-library/react";
import type { DashboardEvent } from "@/api/types";
import { EventTimeline } from "./EventTimeline";

const event = (seconds: number, summary: string): DashboardEvent => ({
  ts: new Date(Date.UTC(2026, 10, 5, 18, 0, seconds)).toISOString(),
  type: "ACTION",
  summary,
});

describe("EventTimeline", () => {
  it("lists events newest first, capped at the limit", () => {
    render(
      <EventTimeline
        events={[event(1, "first"), event(3, "third"), event(2, "second")]}
        limit={2}
      />,
    );
    const items = within(screen.getByRole("list", { name: "Event timeline" })).getAllByRole(
      "listitem",
    );
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining("third"),
      expect.stringContaining("second"),
    ]);
  });

  it("renders event text as plain text", () => {
    render(<EventTimeline events={[event(1, "<img src=x onerror=alert(1)>")]} />);
    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
  });

  it("has an empty state", () => {
    render(<EventTimeline events={[]} />);
    expect(screen.getByText("No events yet.")).toBeInTheDocument();
  });
});
