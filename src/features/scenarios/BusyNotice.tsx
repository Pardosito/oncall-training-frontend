import { InlineNotification, ProgressBar, Stack } from "@carbon/react";
import { useEffect, useState } from "react";

type Props = {
  /** From the 409 SESSION_BUSY details: when the running session times out at the latest. */
  retryAfterSeconds: number;
  onClose: () => void;
};

/**
 * FE-065: someone else's incident is running. Shows roughly how long until it ends, with a
 * countdown bar. Start stays enabled for a manual retry. Screen readers hear the minutes only,
 * not every second.
 */
export function BusyNotice({ retryAfterSeconds, onClose }: Props) {
  const total = Math.max(1, Math.round(retryAfterSeconds));
  const [deadline] = useState(() => Date.now() + total * 1000);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const left = Math.max(0, Math.ceil((deadline - now) / 1000));
  const minutes = Math.ceil(left / 60);
  const label =
    left === 0
      ? "It should be free now. Try starting again."
      : `About ${minutes} min left. You can try again sooner; it may end early.`;

  return (
    <InlineNotification
      kind="info"
      lowContrast
      title="Another incident is running"
      subtitle="Another engineer is handling an incident. You can start when it ends."
      onClose={() => {
        onClose();
        return false;
      }}
    >
      <Stack gap={3}>
        <ProgressBar
          label="Time until it ends"
          hideLabel
          max={total}
          value={total - left}
          size="small"
          status={left === 0 ? "finished" : "active"}
        />
        <p aria-live="polite">{label}</p>
      </Stack>
    </InlineNotification>
  );
}
