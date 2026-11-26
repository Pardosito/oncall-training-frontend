import type { SessionView } from "@/api/types";
import { PageHeader, SessionStateTag } from "@/components";
import { isTerminal } from "../lib/session";
import { AbandonControl } from "./AbandonControl";
import { IncidentTimer } from "./IncidentTimer";

type Props = {
  title: string;
  session: SessionView;
  /** True while the abandon request is in flight or already queued. */
  abandoning: boolean;
  onAbandon: () => void;
};

/** Scenario title, state tag, incident timer and Abandon (FE-089). */
export function ConsoleHeader({ title, session, abandoning, onAbandon }: Props) {
  return (
    <PageHeader
      title={title}
      actions={
        <>
          <SessionStateTag state={session.state} />
          <IncidentTimer faultInjectedAt={session.faultInjectedAt} endedAt={session.endedAt} />
          <AbandonControl
            disabled={abandoning || isTerminal(session.state)}
            onConfirm={onAbandon}
          />
        </>
      }
    />
  );
}
