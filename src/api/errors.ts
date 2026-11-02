import type { ErrorCode } from "./types";

/** Codes from the spec's `ErrorCode` enum, plus two the client produces itself. */
export type ApiErrorCode = ErrorCode | "NETWORK_ERROR" | "UNKNOWN";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details: Record<string, unknown>;
  readonly requestId: string | undefined;

  constructor(init: {
    status: number;
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string;
  }) {
    super(init.message);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.details = init.details ?? {};
    this.requestId = init.requestId;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Builds an ApiError from a non-2xx response body. Works with the backend's error shape
 * (ARCHITECTURE §12), an empty body, or anything else a proxy might return.
 */
export function toApiError(status: number, body: unknown, fallbackRequestId?: string): ApiError {
  const error = isRecord(body) && isRecord(body.error) ? body.error : undefined;
  const code = typeof error?.code === "string" ? (error.code as ErrorCode) : "UNKNOWN";
  const message =
    typeof error?.message === "string" ? error.message : `Request failed with status ${status}`;
  const details = isRecord(error?.details) ? error.details : {};
  const requestId = typeof error?.requestId === "string" ? error.requestId : fallbackRequestId;
  return new ApiError({ status, code, message, details, requestId });
}

export function networkError(cause: unknown, requestId?: string): ApiError {
  const error = new ApiError({
    status: 0,
    code: "NETWORK_ERROR",
    message: "Network request failed",
    requestId,
  });
  error.cause = cause;
  return error;
}
