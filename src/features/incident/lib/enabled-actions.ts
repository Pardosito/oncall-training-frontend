import type { ActionType, SessionState } from "@/api/types";

export type ActionPanelModel = {
  acknowledge: { visible: boolean; enabled: boolean };
  restart: { visible: boolean; enabled: boolean; targets: string[] };
  scale: { visible: boolean; enabled: boolean; targets: string[] };
};

type Input = {
  state: SessionState;
  /** From the dashboard snapshot (the scenario's list); only these are rendered. */
  availableActions: readonly ActionType[];
  /** Service names from the dashboard; they're the only valid targets. */
  services: readonly string[];
  /** Action types whose request is in flight. */
  pending: readonly ActionType[];
};

/**
 * Which actions the panel shows and enables (ARCHITECTURE §5):
 * only available actions are shown; STARTING allows only Acknowledge; terminal allows nothing;
 * an action with a request in flight is disabled.
 */
export function actionPanelModel({
  state,
  availableActions,
  services,
  pending,
}: Input): ActionPanelModel {
  const active = state === "INCIDENT_ACTIVE";
  const open = state === "STARTING" || active;
  const has = (type: ActionType) => availableActions.includes(type);
  const idle = (type: ActionType) => !pending.includes(type);
  const targets = [...services];

  return {
    acknowledge: {
      visible: has("ACKNOWLEDGE"),
      enabled: open && has("ACKNOWLEDGE") && idle("ACKNOWLEDGE"),
    },
    restart: {
      visible: has("RESTART_DEPLOYMENT"),
      enabled:
        active && has("RESTART_DEPLOYMENT") && idle("RESTART_DEPLOYMENT") && targets.length > 0,
      targets,
    },
    scale: {
      visible: has("SCALE_DEPLOYMENT"),
      enabled: active && has("SCALE_DEPLOYMENT") && idle("SCALE_DEPLOYMENT") && targets.length > 0,
      targets,
    },
  };
}
