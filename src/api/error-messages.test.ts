import { ApiError } from "./errors";
import { errorMessage } from "./error-messages";

const apiError = (status: number, code: ApiError["code"]) =>
  new ApiError({ status, code, message: "backend text that must not be shown" });

describe("errorMessage", () => {
  it.each([
    [409, "SESSION_BUSY", /another engineer/i],
    [409, "SESSION_NOT_ACTIVE", /no longer active/i],
    [422, "ACTION_NOT_ALLOWED", /isn't available/i],
    [504, "STATS_TIMEOUT", /taking too long/i],
    [0, "NETWORK_ERROR", /can't reach the server/i],
    [404, "NOT_FOUND", /couldn't find/i],
    [500, "INTERNAL", /server had a problem/i],
    [503, "UNKNOWN", /server had a problem/i],
  ] as const)("maps %i %s", (status, code, expected) => {
    const message = errorMessage(apiError(status, code));
    expect(message).toMatch(expected);
    expect(message).not.toContain("backend text");
  });

  it("has a generic message for non-API errors", () => {
    expect(errorMessage(new Error("boom"))).toMatch(/something went wrong/i);
  });
});
