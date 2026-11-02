import { formatClock, formatDuration } from "./format-duration";

describe("formatDuration", () => {
  it.each([
    [0, "0s"],
    [9, "9s"],
    [125, "2m 05s"],
    [3725, "1h 02m 05s"],
    [-4, "0s"],
    [59.6, "1m 00s"],
  ])("%s → %s", (input, expected) => expect(formatDuration(input)).toBe(expected));

  it("shows a dash for missing values", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(undefined)).toBe("—");
    expect(formatDuration(Number.NaN)).toBe("—");
  });
});

describe("formatClock", () => {
  it.each([
    [0, "00:00"],
    [65, "01:05"],
    [3725, "62:05"],
    [-3, "00:00"],
    [9.9, "00:09"],
  ])("%s → %s", (input, expected) => expect(formatClock(input)).toBe(expected));
});
