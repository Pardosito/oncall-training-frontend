import { act, fireEvent, render, screen } from "@testing-library/react";
import { useToast } from "./toast-context";
import { TOAST_TIMEOUT_MS, ToastProvider } from "./ToastProvider";

function Trigger() {
  const show = useToast();
  return (
    <button type="button" onClick={() => show({ kind: "info", title: "Action queued" })}>
      Notify
    </button>
  );
}

describe("ToastProvider", () => {
  afterEach(() => vi.useRealTimers());

  it("shows a toast without moving focus and hides it after 5 s", async () => {
    vi.useFakeTimers();
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    );
    const button = screen.getByRole("button", { name: "Notify" });
    button.focus();
    fireEvent.click(button);

    expect(screen.getByText("Action queued")).toBeInTheDocument();
    expect(button).toHaveFocus();

    await act(() => vi.advanceTimersByTimeAsync(TOAST_TIMEOUT_MS));
    expect(screen.queryByText("Action queued")).not.toBeInTheDocument();
  });
});
