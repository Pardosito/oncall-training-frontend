import type { User, UserManagerSettings } from "oidc-client-ts";
import type { Env } from "@/config/env";
import type { CurrentUser } from "./auth-context";

export type CognitoConfig = Extract<Env, { authMode: "cognito" }>["cognito"];

/**
 * The ID-token claim shown as the display name (O-02). Cognito's `cognito:username` matches the
 * access token's `username`, which is what the backend stores for the leaderboard.
 */
export const USERNAME_CLAIM = "cognito:username";

/**
 * oidc-client-ts settings (ARCHITECTURE §4): authorization code, PKCE, refresh-token renew.
 * PKCE needs Web Crypto, which browsers only expose on HTTPS or localhost. On the plain-HTTP S3
 * website endpoint (D-25) it's turned off; the code still only works with this client id and the
 * registered redirect URI.
 */
export function oidcSettings(
  config: CognitoConfig,
  origin: string = window.location.origin,
  secureContext: boolean = window.isSecureContext,
): UserManagerSettings {
  return {
    authority: config.authority,
    client_id: config.clientId,
    redirect_uri: config.redirectUri ?? `${origin}/callback`,
    response_type: "code",
    scope: "openid email profile",
    automaticSilentRenew: true,
    loadUserInfo: false,
    disablePKCE: !secureContext,
  };
}

/** Cognito's sign-out (it has no OIDC end_session_endpoint), ARCHITECTURE §4. */
export function logoutUrl(config: CognitoConfig, origin: string = window.location.origin): string {
  const url = new URL(`${config.domain}/logout`);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("logout_uri", config.logoutUri ?? `${origin}/`);
  return url.toString();
}

export function toCurrentUser(user: User | null | undefined): CurrentUser | null {
  if (!user || user.expired) return null;
  const claim = user.profile[USERNAME_CLAIM];
  const username =
    typeof claim === "string" && claim
      ? claim
      : (user.profile.preferred_username ?? user.profile.sub);
  return { userId: user.profile.sub, username };
}

/** `returnTo` saved in the sign-in request's state, if any. */
export function returnToFromState(state: unknown): string | null {
  if (state && typeof state === "object" && "returnTo" in state) {
    const value = state.returnTo;
    return typeof value === "string" ? value : null;
  }
  return null;
}
