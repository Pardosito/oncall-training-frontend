// In-memory stand-in for one backend session (ARCHITECTURE §10, FE-034–FE-036). It follows the
// backend's rules (backend ARCHITECTURE §4–§5): warmup → fault (orders scaled to 0) → a valid
// fix (scale orders to ≥ 1) → healthy a few seconds later → RESOLVED with a score.
// State is derived from the clock on every read, so tests drive it with fake timers.
import type {
  ActionRequest,
  DashboardEvent,
  DashboardSnapshot,
  ScenarioPublic,
  ServiceStatus,
  SessionView,
} from "@/api/types";

export const RECOVERY_SECONDS = 4;
const BASELINE: Record<string, number> = { gateway: 1, orders: 2, "worker-svc": 1 };

type SimSession = {
  sessionId: string;
  scenario: ScenarioPublic;
  createdAt: number;
  acknowledgedAt?: number;
  validFixAt?: number;
  /** Replicas chosen by the user; applied when the session time passes the action time. */
  scaled: { at: number; target: string; replicas: number }[];
  restarts: { at: number; target: string }[];
  wrongActions: number;
  actionsCount: number;
  events: { at: number; type: DashboardEvent["type"]; summary: string }[];
};

export class SimulatorError extends Error {
  constructor(
    readonly status: 404 | 409 | 422,
    readonly code: "NOT_FOUND" | "SESSION_NOT_ACTIVE" | "ACTION_NOT_ALLOWED",
    message: string,
  ) {
    super(message);
  }
}

const iso = (ms: number) => new Date(ms).toISOString();
const secondsBetween = (from: number, to: number) => Math.max(0, Math.round((to - from) / 1000));

export function computeScore(
  scoring: ScenarioPublic["scoring"],
  ttdSeconds: number,
  ttrSeconds: number,
  wrongActions: number,
): number {
  const { base, perSecondTTD, perSecondTTR, perWrongAction } = scoring;
  return Math.max(
    0,
    base - perSecondTTD * ttdSeconds - perSecondTTR * ttrSeconds - perWrongAction * wrongActions,
  );
}

export function createSimulator(now: () => number = () => Date.now()) {
  const sessions = new Map<string, SimSession>();
  let counter = 0;

  const faultAt = (s: SimSession) => s.createdAt + s.scenario.warmupSeconds * 1000;
  const resolvedAt = (s: SimSession) =>
    s.validFixAt === undefined ? undefined : s.validFixAt + RECOVERY_SECONDS * 1000;
  const timeoutAt = (s: SimSession) => faultAt(s) + s.scenario.maxResolveSeconds * 1000;

  function stateAt(s: SimSession, t: number): SessionView["state"] {
    const resolved = resolvedAt(s);
    if (resolved !== undefined && t >= resolved) return "RESOLVED";
    if (t >= timeoutAt(s)) return "FAILED";
    if (t >= faultAt(s)) return "INCIDENT_ACTIVE";
    return "STARTING";
  }

  function get(sessionId: string): SimSession {
    const session = sessions.get(sessionId);
    if (!session) throw new SimulatorError(404, "NOT_FOUND", "Session not found");
    return session;
  }

  function timeline(s: SimSession, t: number) {
    const events: SimSession["events"] = [...s.events];
    events.push({ at: faultAt(s), type: "FAULT_INJECTED", summary: "Incident started" });
    const resolved = resolvedAt(s);
    if (resolved !== undefined) {
      events.push({ at: resolved, type: "RESOLVED", summary: "All services healthy: resolved" });
    } else {
      events.push({ at: timeoutAt(s), type: "FAILED", summary: "Time limit reached" });
    }
    return events.filter((e) => e.at <= t).sort((a, b) => b.at - a.at);
  }

  function view(s: SimSession, t: number): SessionView {
    const state = stateAt(s, t);
    const fault = faultAt(s);
    const result: SessionView = {
      sessionId: s.sessionId,
      scenarioId: s.scenario.id,
      state,
      createdAt: iso(s.createdAt),
      wrongActions: s.wrongActions,
      actionsCount: s.actionsCount,
    };
    if (t >= fault) result.faultInjectedAt = iso(fault);
    if (s.acknowledgedAt !== undefined) result.acknowledgedAt = iso(s.acknowledgedAt);
    if (state === "RESOLVED") {
      const end = resolvedAt(s)!;
      const ttr = secondsBetween(fault, end);
      const ttd = s.acknowledgedAt !== undefined ? secondsBetween(fault, s.acknowledgedAt) : ttr;
      Object.assign(result, {
        endedAt: iso(end),
        ttrSeconds: ttr,
        ttdSeconds: ttd,
        score: computeScore(s.scenario.scoring, ttd, ttr, s.wrongActions),
      });
    } else if (state === "FAILED") {
      Object.assign(result, { endedAt: iso(timeoutAt(s)), failureReason: "TIMEOUT" });
    }
    return result;
  }

  function servicesAt(s: SimSession, t: number): ServiceStatus[] {
    const fault = faultAt(s);
    const ordersDesired =
      t < fault
        ? BASELINE.orders!
        : (s.scaled.filter((a) => a.target === "orders" && a.at <= t).at(-1)?.replicas ?? 0);
    const fix = s.validFixAt;
    const ordersReady =
      t < fault
        ? ordersDesired
        : fix !== undefined && t >= fix + RECOVERY_SECONDS * 1000
          ? ordersDesired
          : 0;
    const ordersDown = ordersReady === 0;

    return Object.entries(BASELINE).map(([name, baseline]) => {
      const desired = name === "orders" ? ordersDesired : baseline;
      const ready = name === "orders" ? ordersReady : baseline;
      const restarting = s.restarts.some(
        (r) => r.target === name && t >= r.at && t < r.at + RECOVERY_SECONDS * 1000,
      );
      let health: ServiceStatus["health"] = "healthy";
      let latencyMs: number | undefined = name === "gateway" ? 12 : 8;
      if (name === "orders" && ordersDown) {
        health = "down";
        latencyMs = undefined;
      } else if (name === "gateway" && ordersDown) {
        health = "degraded";
        latencyMs = 950;
      } else if (restarting) {
        health = "degraded";
      }
      const pods = Array.from({ length: ready }, (_, i) => ({
        name: `${name}-7f9c${i}-${s.sessionId.slice(-4).toLowerCase()}`,
        phase: "Running",
        ready: !restarting,
        restarts: 0,
        ageSeconds: secondsBetween(s.createdAt, t),
      }));
      const service: ServiceStatus = {
        name,
        desiredReplicas: desired,
        readyReplicas: ready,
        health,
        pods,
      };
      if (latencyMs !== undefined) service.latencyMs = latencyMs;
      return service;
    });
  }

  return {
    reset() {
      sessions.clear();
      counter = 0;
    },

    start(scenario: ScenarioPublic): { sessionId: string } {
      counter += 1;
      const sessionId = `01JMOCKSESSION${String(counter).padStart(12, "0")}`;
      const t = now();
      sessions.set(sessionId, {
        sessionId,
        scenario,
        createdAt: t,
        scaled: [],
        restarts: [],
        wrongActions: 0,
        actionsCount: 0,
        events: [{ at: t, type: "SESSION_STARTED", summary: "Session started" }],
      });
      return { sessionId };
    },

    session(sessionId: string): SessionView {
      return view(get(sessionId), now());
    },

    dashboard(sessionId: string): DashboardSnapshot {
      const s = get(sessionId);
      const t = now();
      const events: DashboardEvent[] = timeline(s, t)
        .slice(0, 20)
        .map((e) => ({ ts: iso(e.at), type: e.type, summary: e.summary }));
      return {
        sessionId,
        state: stateAt(s, t),
        generatedAt: iso(t),
        elapsedSeconds: secondsBetween(s.createdAt, t),
        services: servicesAt(s, t),
        recentEvents: events,
        availableActions: s.scenario.availableActions,
      };
    },

    action(sessionId: string, request: ActionRequest): { actionId: string } {
      const s = get(sessionId);
      const t = now();
      const state = stateAt(s, t);
      const { type } = request;
      const target = "target" in request ? request.target : undefined;
      if (state === "RESOLVED" || state === "FAILED") {
        throw new SimulatorError(409, "SESSION_NOT_ACTIVE", "Session is not active");
      }
      if (!s.scenario.availableActions.includes(type)) {
        throw new SimulatorError(422, "ACTION_NOT_ALLOWED", "Action not available");
      }
      if (
        type !== "ACKNOWLEDGE" &&
        (target === undefined || !s.scenario.targets.includes(target))
      ) {
        throw new SimulatorError(422, "ACTION_NOT_ALLOWED", "Unknown target");
      }
      if (type !== "ACKNOWLEDGE" && state === "STARTING") {
        throw new SimulatorError(422, "ACTION_NOT_ALLOWED", "The incident hasn't started");
      }

      s.actionsCount += 1;
      const actionId = `01JMOCKACTION${String(s.actionsCount).padStart(13, "0")}`;
      if (type === "ACKNOWLEDGE") {
        if (state === "INCIDENT_ACTIVE" && s.acknowledgedAt === undefined) s.acknowledgedAt = t;
        s.events.push({ at: t, type: "ACKNOWLEDGED", summary: "Incident acknowledged" });
        return { actionId };
      }

      if (type === "SCALE_DEPLOYMENT") {
        const replicas = request.type === "SCALE_DEPLOYMENT" ? request.params.replicas : 1;
        s.scaled.push({ at: t, target: target!, replicas });
        s.events.push({ at: t, type: "ACTION", summary: `Scaled ${target} to ${replicas}` });
        const valid = target === "orders" && replicas >= 1;
        if (valid) s.validFixAt ??= t;
        else s.wrongActions += 1;
      } else if (type === "RESTART_DEPLOYMENT") {
        s.restarts.push({ at: t, target: target! });
        s.events.push({ at: t, type: "ACTION", summary: `Restarted ${target}` });
        s.wrongActions += 1;
      }
      return { actionId };
    },
  };
}

export type Simulator = ReturnType<typeof createSimulator>;
