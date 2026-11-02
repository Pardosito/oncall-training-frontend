/** Only same-origin relative paths are accepted, so sign-in can't become an open redirect. */
export function safeReturnTo(path: string | null | undefined, fallback = "/scenarios"): string {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return fallback;
  }
  return path;
}
