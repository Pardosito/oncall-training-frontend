import { Button, Stack, Tile } from "@carbon/react";
import { Checkmark, Maximize } from "@carbon/icons-react";
import { useRef, useState } from "react";
import type { ActionRequest } from "@/api/types";
import type { ActionPanelModel } from "../lib/enabled-actions";
import styles from "./ActionPanel.module.scss";
import { RestartControl } from "./RestartControl";
import { ScaleModal } from "./ScaleModal";

type Props = {
  model: ActionPanelModel;
  onAction: (action: ActionRequest) => void;
};

/** The predefined fixes. Acknowledge sends at once; restart and scale ask first (FE-083–085). */
export function ActionPanel({ model, onAction }: Props) {
  const [scaling, setScaling] = useState(false);
  const scaleRef = useRef<HTMLButtonElement>(null);

  return (
    <Tile className={styles.panel}>
      <Stack gap={6}>
        <h2 className={styles.heading}>Actions</h2>
        {model.acknowledge.visible ? (
          <Button
            kind="primary"
            size="md"
            renderIcon={Checkmark}
            disabled={!model.acknowledge.enabled}
            onClick={() => onAction({ type: "ACKNOWLEDGE" })}
          >
            Acknowledge
          </Button>
        ) : null}
        {model.restart.visible ? (
          <RestartControl
            enabled={model.restart.enabled}
            targets={model.restart.targets}
            onConfirm={(target) => onAction({ type: "RESTART_DEPLOYMENT", target })}
          />
        ) : null}
        {model.scale.visible ? (
          <>
            <Button
              ref={scaleRef}
              kind="secondary"
              size="md"
              renderIcon={Maximize}
              disabled={!model.scale.enabled}
              onClick={() => setScaling(true)}
            >
              Scale deployment…
            </Button>
            <ScaleModal
              open={scaling}
              targets={model.scale.targets}
              launcherRef={scaleRef}
              onClose={() => setScaling(false)}
              onConfirm={(target, replicas) =>
                onAction({ type: "SCALE_DEPLOYMENT", target, params: { replicas } })
              }
            />
          </>
        ) : null}
      </Stack>
    </Tile>
  );
}
