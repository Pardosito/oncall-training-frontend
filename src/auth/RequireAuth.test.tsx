import { screen } from "@testing-library/react";
import { renderWithProviders, signedIn } from "@/test/render";
import { RequireAuth } from "./RequireAuth";

const routes = [
  {
    element: <RequireAuth />,
    children: [{ path: "sessions/:id", element: <p>Secret console</p> }],
  },
];

describe("RequireAuth", () => {
  it("renders the protected route when signed in", async () => {
    renderWithProviders(null, { routes, route: "/sessions/01J" });
    expect(await screen.findByText("Secret console")).toBeInTheDocument();
  });

  it("sends signed-out users to sign in with the current path", () => {
    const auth = signedIn({ status: "unauthenticated", user: null });
    renderWithProviders(null, { routes, route: "/sessions/01J?tab=logs", auth });
    expect(auth.signIn).toHaveBeenCalledWith("/sessions/01J?tab=logs");
    expect(screen.queryByText("Secret console")).not.toBeInTheDocument();
  });

  it("shows a loader while auth is resolving", () => {
    const auth = signedIn({ status: "loading", user: null });
    renderWithProviders(null, { routes, route: "/sessions/01J", auth });
    expect(auth.signIn).not.toHaveBeenCalled();
    expect(screen.getByText("Checking your sign-in")).toBeInTheDocument();
  });
});
