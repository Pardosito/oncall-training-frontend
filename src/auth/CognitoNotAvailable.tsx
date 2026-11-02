import { InlineNotification } from "@carbon/react";

export function CognitoNotAvailable() {
  return (
    <main className="cds--content">
      <InlineNotification
        kind="warning"
        lowContrast
        hideCloseButton
        title="Cognito sign-in isn't available yet"
        subtitle="It arrives with the Nov 19 milestone. Run with VITE_AUTH_MODE=dev for now."
      />
    </main>
  );
}
