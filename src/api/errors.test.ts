import { ApiError, isApiError, networkError, toApiError } from "./errors";

describe("toApiError", () => {
  it("reads the backend error body", () => {
    const error = toApiError(409, {
      error: {
        code: "SESSION_BUSY",
        message: "A scenario is already running.",
        details: { retryAfterSeconds: 412 },
        requestId: "01JREQ",
      },
    });
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 409,
      code: "SESSION_BUSY",
      message: "A scenario is already running.",
      details: { retryAfterSeconds: 412 },
      requestId: "01JREQ",
    });
  });

  it("still produces a usable error from an empty body", () => {
    const error = toApiError(502, undefined, "01JFALLBACK");
    expect(error).toMatchObject({ status: 502, code: "UNKNOWN", requestId: "01JFALLBACK" });
    expect(error.message).toContain("502");
  });

  it("ignores bodies that aren't the error shape", () => {
    expect(toApiError(500, "<html>").code).toBe("UNKNOWN");
  });
});

describe("networkError", () => {
  it("has status 0 and keeps the cause", () => {
    const cause = new TypeError("Failed to fetch");
    const error = networkError(cause, "01JREQ");
    expect(isApiError(error)).toBe(true);
    expect(error).toMatchObject({ status: 0, code: "NETWORK_ERROR", requestId: "01JREQ" });
    expect(error.cause).toBe(cause);
  });
});
