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
