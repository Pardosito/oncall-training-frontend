import { Button, InlineNotification, Loading, Stack } from "@carbon/react";
import { Navigate } from "react-router";
import { useDocumentTitle } from "@/lib/useDocumentTitle";
import { safeReturnTo } from "./return-to";
import { useAuth } from "./useAuth";

/**
 * `/callback` (FE-042): waits while the code is exchanged, then replaces the URL with the stored
 * `returnTo` (which also drops `code` and `state`). A Cognito error gets a "Try again" button.
 */
export function CallbackPage() {
  useDocumentTitle("Signing in");
  const { status, error, returnTo, signIn } = useAuth();

  if (error) {
    return (
      <Stack gap={5}>
        <InlineNotification
          kind="error"
          lowContrast
          hideCloseButton
          title="Sign-in failed"
          subtitle={error}
        />
        <div>
          <Button kind="primary" size="md" onClick={() => signIn("/scenarios")}>
            Try again
          </Button>
        </div>
      </Stack>
    );
  }
  if (status === "authenticated") return <Navigate to={safeReturnTo(returnTo)} replace />;
  if (status === "unauthenticated") return <Navigate to="/" replace />;
  return <Loading description="Signing you in" withOverlay={false} />;
}
