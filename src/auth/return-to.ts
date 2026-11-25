/** Only same-origin relative paths are accepted, so sign-in can't become an open redirect. */
export function safeReturnTo(path: string | null | undefined, fallback = "/scenarios"): string {
  if (
    !path ||
    !path.startsWith("/") ||
    path.startsWith("//") ||
    path.includes("\\") ||
    // Control characters (tab, newline) can turn the path into another origin when navigated.
    [...path].some((char) => char.charCodeAt(0) < 0x20)
  ) {
    return fallback;
  }
  return path;
}
