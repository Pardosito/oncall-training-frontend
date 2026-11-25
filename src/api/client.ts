import createClient, { type Middleware } from "openapi-fetch";
import { ulid } from "ulid";
import { getAuthHeaders, handleUnauthorized } from "./auth-headers";
import { networkError, toApiError } from "./errors";
import type { paths } from "./schema";

export const REQUEST_ID_HEADER = "x-request-id";

export const requestIdMiddleware: Middleware = {
  onRequest({ request }) {
    if (!request.headers.has(REQUEST_ID_HEADER)) request.headers.set(REQUEST_ID_HEADER, ulid());
    return request;
  },
};

/** Untouched copies of each request, so a 401 can be replayed once after a silent renew. */
const replayable = new WeakMap<Request, Request>();

async function withAuthHeaders(request: Request): Promise<Request> {
  const headers = await getAuthHeaders();
  for (const [name, value] of Object.entries(headers)) request.headers.set(name, value);
  return request;
}

/** Auth headers on every request; on 401, one shared silent renew and one replay (FE-026, FE-027). */
export const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const authed = await withAuthHeaders(request);
    replayable.set(authed, authed.clone());
    return authed;
  },
  async onResponse({ request, response }) {
    if (response.status !== 401) return response;
    const copy = replayable.get(request);
    if (!copy) return response;
    // Another request already renewed the session since this one was sent: just replay.
    const current = await getAuthHeaders();
    const stale = Object.entries(current).some(([k, v]) => request.headers.get(k) !== v);
    if (!stale && !(await handleUnauthorized())) return response;
    // The replay skips the middleware, so a second 401 is returned as is.
    return globalThis.fetch(await withAuthHeaders(copy));
  },
};

/**
 * The only way the app talks to the API (AGENTS rule 3). Paths in the spec already start with
 * /api. Same-origin by default (the Vite proxy in dev); with the SPA on S3, VITE_API_BASE_URL is
 * the ALB (D-25). The origin is spelled out because Request needs an absolute URL in tests.
 */
export const api = createClient<paths>({
  baseUrl:
    (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "") ||
    (globalThis.location?.origin ?? ""),
  // Look fetch up on every call (not once at import) so MSW's patched fetch is used in tests.
  fetch: (request) => globalThis.fetch(request),
});
api.use(requestIdMiddleware, authMiddleware);

type FetchResult<T> = { data?: T; error?: unknown; response: Response };

/**
 * Resolves to the response data, or throws an ApiError for non-2xx responses and network
 * failures. Query hooks wrap every client call with it.
 */
export async function unwrap<T>(call: Promise<FetchResult<T>>): Promise<T> {
  let result: FetchResult<T>;
  try {
    result = await call;
  } catch (error) {
    throw networkError(error);
  }
  const { data, error, response } = result;
  if (!response.ok) {
    throw toApiError(response.status, error, response.headers.get(REQUEST_ID_HEADER) ?? undefined);
  }
  return data as T;
}
