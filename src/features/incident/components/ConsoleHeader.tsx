import type { SessionView } from "@/api/types";
import { PageHeader, SessionStateTag } from "@/components";
import { IncidentTimer } from "./IncidentTimer";

type Props = {
  title: string;
  session: SessionView;
};

/** Scenario title, state tag and incident timer. Abandon joins it in M2 (FE-089). */
export function ConsoleHeader({ title, session }: Props) {
  return (
    <PageHeader
      title={title}
      actions={
        <>
          <SessionStateTag state={session.state} />
          <IncidentTimer faultInjectedAt={session.faultInjectedAt} endedAt={session.endedAt} />
        </>
      }
    />
  );
}
