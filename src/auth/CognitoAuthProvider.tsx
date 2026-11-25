import { UserManager } from "oidc-client-ts";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthProvider as OidcProvider, useAuth as useOidc } from "react-oidc-context";
import { setAuthHeadersProvider, setUnauthorizedHandler } from "@/api/auth-headers";
import { AuthContext, type AuthState } from "./auth-context";
import {
  logoutUrl,
  oidcSettings,
  returnToFromState,
  toCurrentUser,
  type CognitoConfig,
} from "./oidc-config";
import { safeReturnTo } from "./return-to";

function currentPath(): string {
  return safeReturnTo(`${window.location.pathname}${window.location.search}`);
}

/**
 * Cognito sign-in (FE-040): react-oidc-context around one UserManager, bridged to the app's
 * AuthContext so nothing outside src/auth/ touches the OIDC libraries (CONVENTIONS §7).
 */
export function CognitoAuthProvider({
  config,
  children,
}: {
  config: CognitoConfig;
  children: ReactNode;
}) {
  const [userManager] = useState(() => new UserManager(oidcSettings(config)));
  return (
    // The /callback route navigates to returnTo (and drops code/state from the URL) itself.
    <OidcProvider userManager={userManager} onSigninCallback={() => undefined}>
      <CognitoBridge config={config} userManager={userManager}>
        {children}
      </CognitoBridge>
    </OidcProvider>
  );
}

function CognitoBridge({
  config,
  userManager,
  children,
}: {
  config: CognitoConfig;
  userManager: UserManager;
  children: ReactNode;
}) {
  const oidc = useOidc();

  // FE-026: the access token on every API request. Registered during render (idempotent) so it's
  // in place before any child query runs. The token is never logged.
  setAuthHeadersProvider(async () => {
    const user = await userManager.getUser();
    const headers: Record<string, string> = {};
    if (user && !user.expired) headers.authorization = `Bearer ${user.access_token}`;
    return headers;
  });

  // FE-027: on 401, one silent renew (refresh token); if that fails, sign in again.
  useEffect(() => {
    setUnauthorizedHandler(async () => {
      try {
        return Boolean(await userManager.signinSilent());
      } catch {
        await userManager.removeUser();
        await userManager.signinRedirect({ state: { returnTo: currentPath() } });
        return false;
      }
    });
    return () => setUnauthorizedHandler(undefined);
  }, [userManager]);

  const { isLoading, activeNavigator, isAuthenticated, user, error } = oidc;
  const value = useMemo<AuthState>(
    () => ({
      status:
        isLoading || activeNavigator
          ? "loading"
          : isAuthenticated
            ? "authenticated"
            : "unauthenticated",
      user: toCurrentUser(user),
      error: error ? error.message : null,
      returnTo: returnToFromState(user?.state),
      signIn: (returnTo) => {
        void userManager.signinRedirect({ state: { returnTo: safeReturnTo(returnTo) } });
      },
      // FE-045: drop the local session, then end Cognito's (the query cache is cleared by useSignOut).
      signOut: () => {
        void userManager.removeUser().finally(() => window.location.assign(logoutUrl(config)));
      },
    }),
    [isLoading, activeNavigator, isAuthenticated, user, error, userManager, config],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
