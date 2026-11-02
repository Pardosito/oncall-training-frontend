import { act, render, screen } from "@testing-library/react";
import { IncidentTimer } from "./IncidentTimer";

describe("IncidentTimer", () => {
  afterEach(() => vi.useRealTimers());

  it("shows --:-- before the fault", () => {
    render(<IncidentTimer />);
    expect(screen.getByRole("timer")).toHaveTextContent("--:--");
  });

  it("ticks every second from the fault", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-05T18:00:05Z") });
    render(<IncidentTimer faultInjectedAt="2026-11-05T18:00:00Z" />);
    expect(screen.getByRole("timer")).toHaveTextContent("00:05");
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(screen.getByRole("timer")).toHaveTextContent("01:05");
  });

  it("freezes at the end of the session", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-05T19:00:00Z") });
    render(<IncidentTimer faultInjectedAt="2026-11-05T18:00:00Z" endedAt="2026-11-05T18:02:10Z" />);
    await act(() => vi.advanceTimersByTimeAsync(5_000));
    expect(screen.getByRole("timer")).toHaveTextContent("02:10");
  });
});
