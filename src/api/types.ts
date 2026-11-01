// Shapes derived from the generated spec types (CONVENTIONS §1). Never redeclare them by hand.
import type { components } from "./schema";

type Schemas = components["schemas"];

export type ErrorCode = Schemas["ErrorCode"];
export type ErrorBody = Schemas["ErrorBody"];
export type ActionType = Schemas["ActionType"];
export type SessionState = Schemas["SessionState"];
export type FailureReason = Schemas["FailureReason"];
export type ScenarioSummary = Schemas["ScenarioSummary"];
export type ScenarioPublic = Schemas["ScenarioPublic"];
export type SessionView = Schemas["SessionView"];
export type DashboardSnapshot = Schemas["DashboardSnapshot"];
export type ServiceStatus = Schemas["ServiceView"];
export type ServiceHealth = Schemas["ServiceHealth"];
export type Pod = Schemas["PodView"];
export type DashboardEvent = Schemas["RecentEvent"];
export type ActionRequest = Schemas["ActionRequest"];
export type ActionAccepted = Schemas["ActionAccepted"];
