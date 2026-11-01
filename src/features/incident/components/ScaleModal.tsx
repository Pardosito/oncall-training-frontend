import { Dropdown, Modal, NumberInput, Stack } from "@carbon/react";
import { useState, type RefObject } from "react";

export const MIN_REPLICAS = 1;
export const MAX_REPLICAS = 3;

type Props = {
  open: boolean;
  targets: readonly string[];
  launcherRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  onConfirm: (target: string, replicas: number) => void;
};

/** Pick a deployment and a replica count (1–3), then confirm (ARCHITECTURE §5, FE-085). */
export function ScaleModal({ open, targets, launcherRef, onClose, onConfirm }: Props) {
  const [target, setTarget] = useState<string | null>(null);
  const [replicas, setReplicas] = useState<number | "">(2);

  const replicasValid =
    typeof replicas === "number" &&
    Number.isInteger(replicas) &&
    replicas >= MIN_REPLICAS &&
    replicas <= MAX_REPLICAS;
  const valid = target !== null && replicasValid;

  function handleClose() {
    setTarget(null);
    setReplicas(2);
    onClose();
  }

  return (
    <Modal
      open={open}
      modalHeading="Scale deployment"
      primaryButtonText="Scale"
      secondaryButtonText="Cancel"
      primaryButtonDisabled={!valid}
      launcherButtonRef={launcherRef}
      onRequestClose={handleClose}
      onRequestSubmit={() => {
        if (!valid) return;
        onConfirm(target, replicas);
        handleClose();
      }}
      size="sm"
    >
      <Stack gap={6}>
        <Dropdown
          id="scale-target"
          titleText="Deployment"
          label="Choose a deployment"
          items={[...targets]}
          selectedItem={target}
          onChange={({ selectedItem }) => setTarget(selectedItem ?? null)}
        />
        <NumberInput
          id="scale-replicas"
          label={`Replicas (${MIN_REPLICAS}–${MAX_REPLICAS})`}
          min={MIN_REPLICAS}
          max={MAX_REPLICAS}
          step={1}
          allowEmpty
          value={replicas}
          invalid={!replicasValid}
          invalidText={`Enter a whole number from ${MIN_REPLICAS} to ${MAX_REPLICAS}.`}
          onChange={(_event, { value }) => setReplicas(value === "" ? "" : Number(value))}
        />
      </Stack>
    </Modal>
  );
}
