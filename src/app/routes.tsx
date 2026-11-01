import { Navigate, type RouteObject } from "react-router";
import { RequireAuth } from "@/auth";
import { AppShell } from "./AppShell";
import { NotFoundPage } from "./NotFoundPage";
import { PlaceholderPage } from "./PlaceholderPage";
import { RouteError } from "./RouteError";

/** Every screen is lazy-loaded to keep the first load small (CONVENTIONS §4). */
export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      {
        errorElement: <RouteError />,
        children: [
          // The landing page (FE-056/057) waits for Cognito in M2; with dev auth everyone is
          // signed in, which is exactly the "signed-in users go to /scenarios" rule.
          { index: true, element: <Navigate to="/scenarios" replace /> },
          {
            element: <RequireAuth />,
            children: [
              {
                path: "scenarios",
                lazy: async () => ({
                  Component: (await import("@/features/scenarios")).ScenariosPage,
                }),
              },
              {
                path: "scenarios/:scenarioId",
                lazy: async () => ({
                  Component: (await import("@/features/scenarios")).ScenarioDetailPage,
                }),
              },
              {
                path: "sessions/:sessionId",
                lazy: async () => ({
                  Component: (await import("@/features/incident")).IncidentConsolePage,
                }),
              },
              { path: "history", element: <PlaceholderPage title="History" /> },
              { path: "stats", element: <PlaceholderPage title="Stats" /> },
              { path: "leaderboard", element: <PlaceholderPage title="Leaderboard" /> },
            ],
          },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
