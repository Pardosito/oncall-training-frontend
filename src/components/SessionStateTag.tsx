import { Tag } from "@carbon/react";
import type { SessionState } from "@/api/types";

const TAGS = {
  STARTING: { type: "gray", label: "Starting" },
  INCIDENT_ACTIVE: { type: "red", label: "Incident active" },
  RESOLVED: { type: "green", label: "Resolved" },
  FAILED: { type: "magenta", label: "Failed" },
} as const satisfies Record<SessionState, { type: string; label: string }>;

export function SessionStateTag({ state }: { state: SessionState }) {
  const { type, label } = TAGS[state];
  return (
    <Tag type={type} size="md">
      {label}
    </Tag>
  );
}
