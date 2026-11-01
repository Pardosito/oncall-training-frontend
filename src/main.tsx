import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import "./styles/index.scss";
import { ConfigErrorScreen } from "./app/ConfigErrorScreen";
import { Providers } from "./app/providers";
import { createQueryClient } from "./app/query-client";
import { routes } from "./app/routes";
import { EnvError, getEnv, type Env } from "./config/env";

async function bootstrap() {
  const root = createRoot(document.getElementById("root")!);

  let env: Env;
  try {
    env = getEnv();
  } catch (error) {
    if (!(error instanceof EnvError)) throw error;
    root.render(<ConfigErrorScreen keys={error.keys} />);
    return;
  }

  // In-browser mocks are dev-only and opt-in (ARCHITECTURE §10). The dynamic import keeps
  // MSW out of production bundles.
  if (import.meta.env.DEV && env.apiMocks) {
    const { startMockWorker } = await import("./mocks/browser");
    await startMockWorker();
  }

  const router = createBrowserRouter(routes);
  root.render(
    <StrictMode>
      <Providers env={env} queryClient={createQueryClient()}>
        <RouterProvider router={router} />
      </Providers>
    </StrictMode>,
  );
}

void bootstrap();
