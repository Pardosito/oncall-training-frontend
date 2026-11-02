import type { ActionRequest, ActionType } from "@/api/types";

const ACTION_NAMES: Record<ActionType, string> = {
  ACKNOWLEDGE: "Acknowledge",
  VIEW_LOGS: "View logs",
  RESTART_DEPLOYMENT: "Restart deployment",
  SCALE_DEPLOYMENT: "Scale deployment",
};

export function actionName(type: ActionType): string {
  return ACTION_NAMES[type];
}

/** "Scale orders to 2", "Restart worker-svc", "Acknowledge" (FE-071). */
export function actionLabel(action: ActionRequest): string {
  switch (action.type) {
    case "ACKNOWLEDGE":
      return "Acknowledge";
    case "RESTART_DEPLOYMENT":
      return `Restart ${action.target ?? "deployment"}`;
    case "SCALE_DEPLOYMENT":
      return `Scale ${action.target ?? "deployment"} to ${action.params?.replicas ?? "?"}`;
  }
}
