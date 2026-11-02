import { Theme } from "@carbon/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider, type RouteObject } from "react-router";
import { setAuthHeadersProvider } from "@/api/auth-headers";
import { AuthContext, type AuthState } from "@/auth";
import { ToastProvider } from "@/components";

export const testUser = { userId: "test-user", username: "test-user" };

export function signedIn(overrides: Partial<AuthState> = {}): AuthState {
  return {
    status: "authenticated",
    user: testUser,
    signIn: vi.fn(),
    signOut: vi.fn(),
    ...overrides,
  };
}

type Options = {
  /** Starting URL. */
  route?: string;
  /** Routes to mount; defaults to rendering `ui` at every path. */
  routes?: RouteObject[];
  auth?: AuthState;
  /** Fake timers need `advanceTimers` wired into user-event. */
  advanceTimers?: (ms: number) => void;
};

/** Theme + auth + a fresh QueryClient (no retries) + toasts + a memory router (FE-009). */
export function renderWithProviders(ui: ReactNode, options: Options = {}) {
  const { route = "/", routes, auth = signedIn(), advanceTimers } = options;
  setAuthHeadersProvider(() => ({ "x-dev-user": testUser.username }));
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(routes ?? [{ path: "*", element: ui }], {
    initialEntries: [route],
  });
  const user = userEvent.setup(advanceTimers ? { advanceTimers } : {});
  const result = render(
    <Theme theme="g100">
      <AuthContext value={auth}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </QueryClientProvider>
      </AuthContext>
    </Theme>,
  );
  return { ...result, user, router, queryClient };
}
