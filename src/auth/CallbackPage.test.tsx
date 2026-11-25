import { screen } from "@testing-library/react";
import { renderWithProviders, signedIn } from "@/test/render";
import { CallbackPage } from "./CallbackPage";

const routes = [
  { path: "callback", element: <CallbackPage /> },
  { path: "sessions/:id", element: <p>Console</p> },
  { path: "scenarios", element: <p>Scenarios</p> },
];

describe("CallbackPage", () => {
  it("shows a loader while the code is exchanged", () => {
    const auth = signedIn({ status: "loading", user: null });
    renderWithProviders(null, { routes, route: "/callback?code=c&state=s", auth });
    expect(screen.getByText("Signing you in")).toBeInTheDocument();
  });

  it("goes to the stored returnTo and drops code/state", async () => {
    const auth = signedIn({ returnTo: "/sessions/01J" });
    const { router } = renderWithProviders(null, {
      routes,
      route: "/callback?code=c&state=s",
      auth,
    });
    expect(await screen.findByText("Console")).toBeInTheDocument();
    expect(router.state.location.search).toBe("");
  });

  it("ignores an unsafe returnTo", async () => {
    const auth = signedIn({ returnTo: "//evil.example" });
    renderWithProviders(null, { routes, route: "/callback", auth });
    expect(await screen.findByText("Scenarios")).toBeInTheDocument();
  });

  it("shows the error with a Try again button", async () => {
    const auth = signedIn({ status: "unauthenticated", user: null, error: "access_denied" });
    const { user } = renderWithProviders(null, { routes, route: "/callback", auth });
    expect(screen.getByText("Sign-in failed")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(auth.signIn).toHaveBeenCalledWith("/scenarios");
  });
});
