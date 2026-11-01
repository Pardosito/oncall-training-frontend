import { InlineNotification, Theme } from "@carbon/react";

/** Shown instead of a blank page when the build-time env is invalid. Lists key names only. */
export function ConfigErrorScreen({ keys }: { keys: string[] }) {
  return (
    <Theme theme="g100">
      <main className="cds--content">
        <InlineNotification
          kind="error"
          hideCloseButton
          title="The app is misconfigured"
          subtitle={`Check these settings: ${keys.join(", ")}. See .env.example.`}
        />
      </main>
    </Theme>
  );
}
