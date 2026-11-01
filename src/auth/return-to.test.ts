import { safeReturnTo } from "./return-to";

describe("safeReturnTo", () => {
  it.each([
    ["/sessions/01J?x=1", "/sessions/01J?x=1"],
    ["https://evil.example", "/scenarios"],
    ["//evil.example", "/scenarios"],
    ["/\\evil.example", "/scenarios"],
    ["", "/scenarios"],
    [undefined, "/scenarios"],
  ])("%s → %s", (input, expected) => {
    expect(safeReturnTo(input)).toBe(expected);
  });
});
