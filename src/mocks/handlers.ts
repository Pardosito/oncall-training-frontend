// MSW handlers shared by the browser (`pnpm dev:mocks`) and Vitest (src/test/setup.ts).
// Bodies are typed from the generated spec, so a contract change breaks them at compile time.
import { delay, http, HttpResponse } from "msw";
import type {
  ActionAccepted,
  ActionRequest,
  DashboardSnapshot,
  ErrorBody,
  ScenarioPublic,
  ScenarioSummary,
  SessionView,
} from "@/api/types";
import { scenarios, toSummary } from "./fixtures";
import { createSimulator, SimulatorError } from "./simulator";

export const simulator = createSimulator();

let requestCounter = 0;

function errorResponse(status: number, code: ErrorBody["error"]["code"], message: string) {
  requestCounter += 1;
  const body: ErrorBody = {
    error: {
      code,
      message,
      requestId: `01JMOCKREQUEST${String(requestCounter).padStart(12, "0")}`,
    },
  };
  return HttpResponse.json(body, { status });
}

function fromSimulator<T>(run: () => T, respond: (value: T) => Response): Response {
  try {
    return respond(run());
  } catch (error) {
    if (error instanceof SimulatorError)
      return errorResponse(error.status, error.code, error.message);
    throw error;
  }
}

/** Small latency in the browser so loading states are visible; none in tests. */
const latency = () => delay(import.meta.env.MODE === "test" ? 0 : 150);

export const handlers = [
  http.get("*/api/scenarios", async () => {
    await latency();
    return HttpResponse.json<ScenarioSummary[]>(scenarios.map(toSummary));
  }),

  http.get<{ scenarioId: string }>("*/api/scenarios/:scenarioId", async ({ params }) => {
    await latency();
    const scenario = scenarios.find((s) => s.id === params.scenarioId);
    if (!scenario) return errorResponse(404, "NOT_FOUND", "Scenario not found");
    return HttpResponse.json<ScenarioPublic>(scenario);
  }),

  http.post<never, { scenarioId: string }>("*/api/sessions", async ({ request }) => {
    await latency();
    const { scenarioId } = await request.json();
    const scenario = scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return errorResponse(404, "NOT_FOUND", "Scenario not found");
    return HttpResponse.json(simulator.start(scenario), { status: 201 });
  }),

  http.get<{ sessionId: string }>("*/api/sessions/:sessionId", ({ params }) =>
    fromSimulator(
      () => simulator.session(params.sessionId),
      (body) => HttpResponse.json<SessionView>(body),
    ),
  ),

  http.get<{ sessionId: string }>("*/api/sessions/:sessionId/dashboard", ({ params }) =>
    fromSimulator(
      () => simulator.dashboard(params.sessionId),
      (body) => HttpResponse.json<DashboardSnapshot>(body),
    ),
  ),

  http.post<{ sessionId: string }, ActionRequest>(
    "*/api/sessions/:sessionId/actions",
    async ({ params, request }) => {
      const body = await request.json();
      await latency();
      return fromSimulator(
        () => simulator.action(params.sessionId, body),
        (accepted) => HttpResponse.json<ActionAccepted>(accepted, { status: 202 }),
      );
    },
  ),
];
