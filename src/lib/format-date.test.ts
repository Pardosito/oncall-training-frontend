import { formatDateTime, formatRelative, formatScore, formatTime } from "./format-date";

const iso = "2026-11-05T18:04:09Z";

describe("date formatters", () => {
  it("formats date and time in the given locale and zone", () => {
    expect(formatDateTime(iso, "en-US", "UTC")).toBe("Nov 5, 2026, 6:04 PM");
    expect(formatTime(iso, "en-US", "America/Mexico_City")).toBe("12:04:09");
  });

  it("formats relative times", () => {
    const now = new Date("2026-11-05T18:07:09Z");
    expect(formatRelative(iso, now, "en-US")).toBe("3 min. ago");
    expect(formatRelative("2026-11-05T18:07:08Z", now, "en-US")).toBe("1 sec. ago");
    expect(formatRelative("2026-11-05T18:07:09Z", now, "en-US")).toBe("now");
  });

  it("formats scores as integers", () => {
    expect(formatScore(1234.4, "en-US")).toBe("1,234");
    expect(formatScore(undefined)).toBe("—");
  });
});
