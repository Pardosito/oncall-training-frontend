import { ApiError } from "@/api/errors";
import { shouldRetry } from "./query-client";

const error = (status: number) =>
  new ApiError({ status, code: status === 0 ? "NETWORK_ERROR" : "UNKNOWN", message: "x" });

describe("shouldRetry", () => {
  it("retries 5xx and network errors up to 2 times", () => {
    expect(shouldRetry(0, error(503))).toBe(true);
    expect(shouldRetry(1, error(0))).toBe(true);
    expect(shouldRetry(2, error(503))).toBe(false);
  });

  it("never retries 4xx", () => {
    expect(shouldRetry(0, error(404))).toBe(false);
    expect(shouldRetry(0, error(409))).toBe(false);
  });
});
