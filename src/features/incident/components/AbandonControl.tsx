import { Button, Modal } from "@carbon/react";
import { useRef, useState } from "react";

type Props = {
  /** Disabled while the request is in flight, once it's queued, and when the session has ended. */
  disabled: boolean;
  onConfirm: () => void;
};

/** "Abandon…" with a danger confirmation (FE-089). */
export function AbandonControl({ disabled, onConfirm }: Props) {
  const [open, setOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button
        ref={launcherRef}
        kind="danger--tertiary"
        size="sm"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        Abandon…
      </Button>
      <Modal
        open={open}
        danger
        size="xs"
        modalHeading="Abandon this incident?"
        primaryButtonText="Abandon"
        secondaryButtonText="Keep working"
        launcherButtonRef={launcherRef}
        onRequestClose={() => setOpen(false)}
        onRequestSubmit={() => {
          setOpen(false);
          onConfirm();
        }}
      >
        <p>The session ends as failed with no score, and the system is reset.</p>
      </Modal>
    </>
  );
}
