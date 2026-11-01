import createClient, { type Middleware } from "openapi-fetch";
import { ulid } from "ulid";
import { getAuthHeaders } from "./auth-headers";
import { networkError, toApiError } from "./errors";
import type { paths } from "./schema";

export const REQUEST_ID_HEADER = "x-request-id";

export const requestIdMiddleware: Middleware = {
  onRequest({ request }) {
    if (!request.headers.has(REQUEST_ID_HEADER)) request.headers.set(REQUEST_ID_HEADER, ulid());
    return request;
  },
};

export const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const headers = await getAuthHeaders();
    for (const [name, value] of Object.entries(headers)) request.headers.set(name, value);
    return request;
  },
};

/**
 * The only way the app talks to the API (AGENTS rule 3). Paths in the spec already start with
 * /api, so requests stay same-origin: CloudFront in AWS, the Vite proxy in dev. The origin is
 * only spelled out because Request needs an absolute URL outside the browser (tests).
 */
export const api = createClient<paths>({
  baseUrl: globalThis.location?.origin ?? "",
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
