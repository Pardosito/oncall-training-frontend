import { Button, InlineNotification, Stack } from "@carbon/react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import { isApiError } from "@/api/errors";

/** Route errorElement: an error state inside the shell instead of a blank page (CONVENTIONS §4). */
export function RouteError() {
  const error = useRouteError();
  const details = import.meta.env.DEV ? describe(error) : undefined;
  return (
    <Stack gap={5} className="cds--content">
      <InlineNotification
        kind="error"
        lowContrast
        hideCloseButton
        title="This page failed to load"
        subtitle={details ?? "Reload the page to try again."}
      />
      <div>
        <Button kind="secondary" onClick={() => window.location.reload()}>
          Reload
        </Button>
      </div>
    </Stack>
  );
}

function describe(error: unknown): string {
  if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`;
  if (isApiError(error)) return `${error.code} (request ${error.requestId ?? "unknown"})`;
  if (error instanceof Error) return error.message;
  return String(error);
}
