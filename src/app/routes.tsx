import { Navigate, type RouteObject } from "react-router";
import { CallbackPage, RequireAuth } from "@/auth";
import { AppShell } from "./AppShell";
import { NotFoundPage } from "./NotFoundPage";
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
          { path: "callback", element: <CallbackPage /> },
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
              {
                path: "history",
                lazy: async () => ({ Component: (await import("@/features/history")).HistoryPage }),
              },
              {
                path: "stats",
                lazy: async () => ({ Component: (await import("@/features/stats")).StatsPage }),
              },
              {
                path: "leaderboard",
                lazy: async () => ({
                  Component: (await import("@/features/leaderboard")).LeaderboardPage,
                }),
              },
            ],
          },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
