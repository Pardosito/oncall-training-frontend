import { actionLabel, actionName } from "./actions";

describe("actionLabel", () => {
  it("describes each action", () => {
    expect(actionLabel({ type: "ACKNOWLEDGE" })).toBe("Acknowledge");
    expect(actionLabel({ type: "RESTART_DEPLOYMENT", target: "worker-svc" })).toBe(
      "Restart worker-svc",
    );
    expect(
      actionLabel({ type: "SCALE_DEPLOYMENT", target: "orders", params: { replicas: 2 } }),
    ).toBe("Scale orders to 2");
  });

  it("names action types", () => {
    expect(actionName("VIEW_LOGS")).toBe("View logs");
  });
});
