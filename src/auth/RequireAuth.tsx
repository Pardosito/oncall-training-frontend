import { Loading } from "@carbon/react";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { safeReturnTo } from "./return-to";
import { useAuth } from "./useAuth";

/** Guards protected routes: shows a loader while auth resolves, otherwise sends the user to sign in. */
export function RequireAuth() {
  const { status, signIn } = useAuth();
  const location = useLocation();
  const returnTo = safeReturnTo(`${location.pathname}${location.search}${location.hash}`);

  useEffect(() => {
    if (status === "unauthenticated") signIn(returnTo);
  }, [status, signIn, returnTo]);

  if (status !== "authenticated")
    return <Loading description="Checking your sign-in" withOverlay={false} />;
  return <Outlet />;
}
