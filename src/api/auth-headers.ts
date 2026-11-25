// The auth layer (src/auth) registers how to authenticate requests; the client only asks for
// headers. This keeps tokens out of components (CONVENTIONS §7) and the OIDC libraries out of src/api.

type AuthHeadersProvider = () => Record<string, string> | Promise<Record<string, string>>;

let provider: AuthHeadersProvider = () => ({});

export function setAuthHeadersProvider(next: AuthHeadersProvider): void {
  provider = next;
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  return provider();
}

/** Resolves true when the session was renewed and the request can be replayed (FE-027). */
type UnauthorizedHandler = () => Promise<boolean>;

let unauthorizedHandler: UnauthorizedHandler | undefined;
let pending: Promise<boolean> | undefined;

export function setUnauthorizedHandler(next: UnauthorizedHandler | undefined): void {
  unauthorizedHandler = next;
  pending = undefined;
}

/** Concurrent 401s share one renew attempt. False when nothing can renew (dev auth). */
export function handleUnauthorized(): Promise<boolean> {
  if (!unauthorizedHandler) return Promise.resolve(false);
  pending ??= unauthorizedHandler().finally(() => {
    pending = undefined;
  });
  return pending;
}
