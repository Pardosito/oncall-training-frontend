import { Button, Dropdown, Modal } from "@carbon/react";
import { Renew } from "@carbon/icons-react";
import { useRef, useState } from "react";
import styles from "./ActionPanel.module.scss";

type Props = {
  enabled: boolean;
  targets: readonly string[];
  onConfirm: (target: string) => void;
};

/** Target picker + Restart, confirmed in a danger modal (FE-084). */
export function RestartControl({ enabled, targets, onConfirm }: Props) {
  const [target, setTarget] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className={styles.control}>
      <Dropdown
        id="restart-target"
        titleText="Restart deployment"
        label="Choose a deployment"
        size="sm"
        items={[...targets]}
        selectedItem={target}
        disabled={!enabled}
        onChange={({ selectedItem }) => setTarget(selectedItem ?? null)}
      />
      <Button
        ref={buttonRef}
        kind="secondary"
        size="sm"
        renderIcon={Renew}
        disabled={!enabled || target === null}
        onClick={() => setConfirming(true)}
      >
        Restart
      </Button>
      <Modal
        open={confirming}
        danger
        size="xs"
        modalHeading={`Restart ${target ?? "deployment"}?`}
        primaryButtonText="Restart"
        secondaryButtonText="Cancel"
        launcherButtonRef={buttonRef}
        onRequestClose={() => setConfirming(false)}
        onRequestSubmit={() => {
          if (target) onConfirm(target);
          setConfirming(false);
        }}
      >
        <p>Every pod of {target} is replaced. Requests may fail while the new pods start.</p>
      </Modal>
    </div>
  );
}
