import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { User, UserManager } from "oidc-client-ts";
import { createMemoryRouter, RouterProvider } from "react-router";
import { CognitoAuthProvider } from "./CognitoAuthProvider";
import { RequireAuth } from "./RequireAuth";
import { useAuth } from "./useAuth";

const config = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test",
  clientId: "test-client",
  domain: "https://auth.example.com",
};

function SignOutButton() {
  const { signOut } = useAuth();
  return (
    <button type="button" onClick={signOut}>
      Sign out
    </button>
  );
}

describe("CognitoAuthProvider sign-out", () => {
  const assign = vi.fn();

  beforeEach(() => {
    const user = new User({
      access_token: "a",
      id_token: "i",
      token_type: "Bearer",
      profile: {
        sub: "u1",
        "cognito:username": "ian",
        iss: config.authority,
        aud: config.clientId,
        exp: 0,
        iat: 0,
      },
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });
    sessionStorage.setItem(
      `oidc.user:${config.authority}:${config.clientId}`,
      user.toStorageString(),
    );
    vi.stubGlobal("location", { ...window.location, assign, origin: "http://localhost:5173" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it("goes to Cognito's logout without starting a new sign-in", async () => {
    const signinRedirect = vi.spyOn(UserManager.prototype, "signinRedirect").mockResolvedValue();
    const router = createMemoryRouter(
      [{ element: <RequireAuth />, children: [{ path: "/", element: <SignOutButton /> }] }],
      { initialEntries: ["/"] },
    );
    render(
      <CognitoAuthProvider config={config}>
        <RouterProvider router={router} />
      </CognitoAuthProvider>,
    );

    await userEvent.click(await screen.findByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(assign).toHaveBeenCalledOnce());
    expect(assign.mock.calls[0]![0]).toMatch(
      /^https:\/\/auth\.example\.com\/logout\?client_id=test-client/,
    );
    expect(signinRedirect).not.toHaveBeenCalled();
    expect(screen.getByText("Checking your sign-in")).toBeInTheDocument();
  });
});
