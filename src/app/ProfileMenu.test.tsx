import { screen } from "@testing-library/react";
import { renderWithProviders, signedIn } from "@/test/render";
import { AppShell } from "./AppShell";

const routes = [{ path: "*", element: <AppShell /> }];

describe("profile menu", () => {
  it("opens from the avatar and shows who is signed in", async () => {
    const { user } = renderWithProviders(null, { routes, route: "/scenarios" });
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Account" }));
    expect(screen.getByRole("button", { name: "Account" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Signed in as")).toBeInTheDocument();
    expect(screen.getByText("test-user")).toBeInTheDocument();
  });

  it("signs out and clears the cache", async () => {
    const auth = signedIn();
    const { user, queryClient } = renderWithProviders(null, { routes, route: "/scenarios", auth });
    queryClient.setQueryData(["scenarios"], []);
    await user.click(screen.getByRole("button", { name: "Account" }));
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(auth.signOut).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(["scenarios"])).toBeUndefined();
  });

  it("closes on Escape", async () => {
    const { user } = renderWithProviders(null, { routes, route: "/scenarios" });
    await user.click(screen.getByRole("button", { name: "Account" }));
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("button", { name: "Sign out" })).not.toBeInTheDocument();
  });

  it("is not shown when signed out", () => {
    renderWithProviders(null, {
      routes,
      route: "/",
      auth: signedIn({ status: "unauthenticated", user: null }),
    });
    expect(screen.queryByRole("button", { name: "Account" })).not.toBeInTheDocument();
  });
});
