import type { SessionState } from "@/api/types";

export const SESSION_POLL_MS = 5000;
export const DASHBOARD_POLL_MS = 2000;

export function isTerminal(state: SessionState | undefined): boolean {
  return state === "RESOLVED" || state === "FAILED";
}
