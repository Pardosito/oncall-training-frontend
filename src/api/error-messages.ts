import { isApiError } from "./errors";

/** UI copy for an error, chosen by code and status, never by message text (CONVENTIONS §6). */
export function errorMessage(error: unknown): string {
  if (!isApiError(error)) return "Something went wrong. Try again.";
  switch (error.code) {
    case "SESSION_BUSY":
      return "Another engineer is handling an incident. You can start when it ends.";
    case "SESSION_NOT_ACTIVE":
      return "This incident is no longer active.";
    case "ACTION_NOT_ALLOWED":
      return "That action isn't available for this incident right now.";
    case "STATS_TIMEOUT":
      return "Your stats are taking too long to load. Try again.";
    case "NETWORK_ERROR":
      return "Can't reach the server. Check your connection and try again.";
    default:
      break;
  }
  if (error.status === 404) return "We couldn't find what you were looking for.";
  if (error.status === 401) return "Your session expired. Sign in again.";
  if (error.status >= 500) return "The server had a problem. Try again in a moment.";
  return "Something went wrong. Try again.";
}
