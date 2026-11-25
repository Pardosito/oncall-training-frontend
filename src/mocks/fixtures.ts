import type {
  LeaderboardResponse,
  ScenarioPublic,
  ScenarioSummary,
  SessionView,
  StatsQueryName,
  StatsResponse,
} from "@/api/types";

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

// History, stats and leaderboard (FE-039): three ended attempts of the mock user.
export const pastSessions: SessionView[] = [
  {
    sessionId: "01JHISTORY0000000000000003",
    scenarioId: "orders-down",
    state: "RESOLVED",
    createdAt: "2026-11-20T18:30:00.000Z",
    faultInjectedAt: "2026-11-20T18:30:10.000Z",
    acknowledgedAt: "2026-11-20T18:30:25.000Z",
    endedAt: "2026-11-20T18:31:40.000Z",
    score: 880,
    ttdSeconds: 15,
    ttrSeconds: 90,
    wrongActions: 1,
    actionsCount: 3,
  },
  {
    sessionId: "01JHISTORY0000000000000002",
    scenarioId: "orders-down",
    state: "FAILED",
    createdAt: "2026-11-19T17:00:00.000Z",
    faultInjectedAt: "2026-11-19T17:00:10.000Z",
    endedAt: "2026-11-19T17:10:10.000Z",
    score: 0,
    wrongActions: 4,
    actionsCount: 5,
    failureReason: "TIMEOUT",
  },
  {
    sessionId: "01JHISTORY0000000000000001",
    scenarioId: "orders-down",
    state: "RESOLVED",
    createdAt: "2026-11-18T16:00:00.000Z",
    faultInjectedAt: "2026-11-18T16:00:10.000Z",
    acknowledgedAt: "2026-11-18T16:00:50.000Z",
    endedAt: "2026-11-18T16:03:10.000Z",
    score: 760,
    ttdSeconds: 40,
    ttrSeconds: 180,
    wrongActions: 2,
    actionsCount: 4,
  },
];

/** Stats rows the backend would compute from `pastSessions` (oldest attempt first). */
export function statsFor(query: StatsQueryName): StatsResponse {
  const ended = [...pastSessions].reverse();
  if (query === "score-over-time") {
    return {
      query,
      rows: ended.map((s, i) => ({
        attempt: i + 1,
        sessionId: s.sessionId,
        scenarioId: s.scenarioId,
        endedAt: s.endedAt ?? s.createdAt,
        state: s.state,
        score: s.score ?? 0,
      })),
    };
  }
  return {
    query,
    rows: ended.map((s, i) => ({
      attempt: i + 1,
      sessionId: s.sessionId,
      scenarioId: s.scenarioId,
      endedAt: s.endedAt ?? s.createdAt,
      state: s.state,
      ttdSeconds: s.ttdSeconds ?? null,
      ttrSeconds: s.state === "RESOLVED" ? (s.ttrSeconds ?? null) : null,
    })),
  };
}

export const leaderboard: LeaderboardResponse = {
  scenarioId: "orders-down",
  entries: [
    { rank: 1, username: "bob", score: 940, ttrSeconds: 60, wrongActions: 0, isYou: false },
    { rank: 2, username: "alice", score: 880, ttrSeconds: 90, wrongActions: 1, isYou: true },
    { rank: 3, username: "carol", score: 700, ttrSeconds: 200, wrongActions: 3, isYou: false },
  ],
};
