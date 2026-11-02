import { QueryClient } from "@tanstack/react-query";
import { isApiError } from "@/api/errors";

const MAX_RETRIES = 2;

/** Retry 5xx and network errors up to twice; never retry 4xx (ARCHITECTURE §8). */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_RETRIES) return false;
  if (!isApiError(error)) return true;
  return error.status === 0 || error.status >= 500;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
}
