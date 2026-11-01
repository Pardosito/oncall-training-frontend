import type { ScenarioPublic, ScenarioSummary } from "@/api/types";

export const ordersDown = {
  id: "orders-down",
  title: "Orders service is not responding",
  description: "Checkout requests are failing with 5xx. Find out why and bring the system back.",
  warmupSeconds: 10,
  maxResolveSeconds: 600,
  targets: ["gateway", "orders", "worker-svc"],
  availableActions: ["ACKNOWLEDGE", "VIEW_LOGS", "RESTART_DEPLOYMENT", "SCALE_DEPLOYMENT"],
  scoring: { base: 1000, perSecondTTD: 1, perSecondTTR: 1, perWrongAction: 25 },
} satisfies ScenarioPublic;

export const scenarios: ScenarioPublic[] = [ordersDown];

export function toSummary(scenario: ScenarioPublic): ScenarioSummary {
  const { id, title, description, maxResolveSeconds } = scenario;
  return { id, title, description, maxResolveSeconds };
}
