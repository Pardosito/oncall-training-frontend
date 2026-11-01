import { ordersDown } from "./fixtures";
import { computeScore, createSimulator, RECOVERY_SECONDS, SimulatorError } from "./simulator";

function setup() {
  let t = Date.parse("2026-11-01T10:00:00Z");
  const sim = createSimulator(() => t);
  const { sessionId } = sim.start(ordersDown);
  const advance = (seconds: number) => {
    t += seconds * 1000;
  };
  return { sim, sessionId, advance };
}

const health = (
  snapshot: ReturnType<ReturnType<typeof createSimulator>["dashboard"]>,
  name: string,
) => snapshot.services.find((s) => s.name === name)?.health;

describe("session simulator", () => {
  it("starts in STARTING with every service healthy", () => {
    const { sim, sessionId } = setup();
    expect(sim.session(sessionId).state).toBe("STARTING");
    expect(sim.dashboard(sessionId).services.every((s) => s.health === "healthy")).toBe(true);
  });

  it("injects the fault after the warmup: orders down, gateway degraded", () => {
    const { sim, sessionId, advance } = setup();
    advance(ordersDown.warmupSeconds);
    const snapshot = sim.dashboard(sessionId);
    expect(sim.session(sessionId)).toMatchObject({ state: "INCIDENT_ACTIVE" });
    expect(sim.session(sessionId).faultInjectedAt).toBeDefined();
    expect(health(snapshot, "orders")).toBe("down");
    expect(health(snapshot, "gateway")).toBe("degraded");
    expect(health(snapshot, "worker-svc")).toBe("healthy");
  });

  it("resolves a few seconds after scaling orders, with TTD, TTR and score", () => {
    const { sim, sessionId, advance } = setup();
    advance(ordersDown.warmupSeconds + 5);
    sim.action(sessionId, { type: "ACKNOWLEDGE" });
    advance(10);
    sim.action(sessionId, { type: "SCALE_DEPLOYMENT", target: "orders", params: { replicas: 2 } });
    advance(RECOVERY_SECONDS - 1);
    expect(sim.session(sessionId).state).toBe("INCIDENT_ACTIVE");
    advance(1);
    expect(sim.session(sessionId)).toMatchObject({
      state: "RESOLVED",
      ttdSeconds: 5,
      ttrSeconds: 15 + RECOVERY_SECONDS,
      wrongActions: 0,
      actionsCount: 2,
      score: computeScore(ordersDown.scoring, 5, 15 + RECOVERY_SECONDS, 0),
    });
    expect(sim.dashboard(sessionId).services.every((s) => s.health === "healthy")).toBe(true);
  });

  it("counts wrong actions and uses TTR as TTD without an acknowledge", () => {
    const { sim, sessionId, advance } = setup();
    advance(ordersDown.warmupSeconds);
    sim.action(sessionId, { type: "RESTART_DEPLOYMENT", target: "gateway" });
    sim.action(sessionId, { type: "SCALE_DEPLOYMENT", target: "orders", params: { replicas: 1 } });
    advance(RECOVERY_SECONDS);
    const view = sim.session(sessionId);
    expect(view).toMatchObject({ state: "RESOLVED", wrongActions: 1 });
    expect(view.ttdSeconds).toBe(view.ttrSeconds);
  });

  it("fails with TIMEOUT after maxResolveSeconds", () => {
    const { sim, sessionId, advance } = setup();
    advance(ordersDown.warmupSeconds + ordersDown.maxResolveSeconds);
    expect(sim.session(sessionId)).toMatchObject({ state: "FAILED", failureReason: "TIMEOUT" });
  });

  it("rejects fixes before the fault and actions after the end", () => {
    const { sim, sessionId, advance } = setup();
    expect(() =>
      sim.action(sessionId, {
        type: "SCALE_DEPLOYMENT",
        target: "orders",
        params: { replicas: 2 },
      }),
    ).toThrow(SimulatorError);
    expect(() => sim.action(sessionId, { type: "ACKNOWLEDGE" })).not.toThrow();
    advance(ordersDown.warmupSeconds + ordersDown.maxResolveSeconds);
    expect(() => sim.action(sessionId, { type: "ACKNOWLEDGE" })).toThrow(
      expect.objectContaining({ status: 409, code: "SESSION_NOT_ACTIVE" }),
    );
  });

  it("rejects unknown targets with ACTION_NOT_ALLOWED", () => {
    const { sim, sessionId, advance } = setup();
    advance(ordersDown.warmupSeconds);
    expect(() => sim.action(sessionId, { type: "RESTART_DEPLOYMENT", target: "db" })).toThrow(
      expect.objectContaining({ status: 422, code: "ACTION_NOT_ALLOWED" }),
    );
  });

  it("returns 404 for unknown sessions", () => {
    const { sim } = setup();
    expect(() => sim.session("nope")).toThrow(expect.objectContaining({ status: 404 }));
  });

  it("keeps the score at 0 or above", () => {
    expect(computeScore(ordersDown.scoring, 900, 900, 10)).toBe(0);
  });
});
