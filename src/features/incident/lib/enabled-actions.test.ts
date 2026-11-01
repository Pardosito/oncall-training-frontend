import type { ActionType } from "@/api/types";
import { actionPanelModel } from "./enabled-actions";

const all: ActionType[] = ["ACKNOWLEDGE", "VIEW_LOGS", "RESTART_DEPLOYMENT", "SCALE_DEPLOYMENT"];
const services = ["gateway", "orders", "worker-svc"];

const enabled = (model: ReturnType<typeof actionPanelModel>) => ({
  ack: model.acknowledge.enabled,
  restart: model.restart.enabled,
  scale: model.scale.enabled,
});

describe("actionPanelModel", () => {
  it("enables everything during an incident, with the dashboard's services as targets", () => {
    const model = actionPanelModel({
      state: "INCIDENT_ACTIVE",
      availableActions: all,
      services,
      pending: [],
    });
    expect(enabled(model)).toEqual({ ack: true, restart: true, scale: true });
    expect(model.scale.targets).toEqual(services);
  });

  it("allows only Acknowledge before the fault", () => {
    const model = actionPanelModel({
      state: "STARTING",
      availableActions: all,
      services,
      pending: [],
    });
    expect(enabled(model)).toEqual({ ack: true, restart: false, scale: false });
  });

  it.each(["RESOLVED", "FAILED"] as const)("allows nothing when %s", (state) => {
    const model = actionPanelModel({ state, availableActions: all, services, pending: [] });
    expect(enabled(model)).toEqual({ ack: false, restart: false, scale: false });
  });

  it("hides actions the scenario doesn't offer", () => {
    const model = actionPanelModel({
      state: "INCIDENT_ACTIVE",
      availableActions: ["ACKNOWLEDGE", "SCALE_DEPLOYMENT"],
      services,
      pending: [],
    });
    expect(model.restart).toMatchObject({ visible: false, enabled: false });
    expect(model.scale.visible).toBe(true);
  });

  it("disables an action while its request is in flight", () => {
    const model = actionPanelModel({
      state: "INCIDENT_ACTIVE",
      availableActions: all,
      services,
      pending: ["SCALE_DEPLOYMENT"],
    });
    expect(enabled(model)).toEqual({ ack: true, restart: true, scale: false });
  });

  it("disables targeted actions when no services are known yet", () => {
    const model = actionPanelModel({
      state: "INCIDENT_ACTIVE",
      availableActions: all,
      services: [],
      pending: [],
    });
    expect(enabled(model)).toEqual({ ack: true, restart: false, scale: false });
  });
});
