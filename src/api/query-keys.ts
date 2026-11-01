// The only source of query keys (CONVENTIONS §6, ARCHITECTURE §8).
export const qk = {
  scenarios: {
    all: ["scenarios"] as const,
    detail: (scenarioId: string) => ["scenarios", scenarioId] as const,
  },
  sessions: {
    detail: (sessionId: string) => ["sessions", sessionId] as const,
    dashboard: (sessionId: string) => ["sessions", sessionId, "dashboard"] as const,
  },
  me: {
    sessions: ["me", "sessions"] as const,
    /** Without a name it matches every stat, for invalidation. */
    stats: (name?: string) =>
      name ? (["me", "stats", name] as const) : (["me", "stats"] as const),
  },
  /** Without a scenario id it matches every leaderboard, for invalidation. */
  leaderboard: (scenarioId?: string) =>
    scenarioId ? (["leaderboard", scenarioId] as const) : (["leaderboard"] as const),
} as const;
