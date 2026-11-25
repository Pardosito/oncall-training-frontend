import { User } from "oidc-client-ts";
import { logoutUrl, oidcSettings, returnToFromState, toCurrentUser } from "./oidc-config";

const config = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_AbC123",
  clientId: "client123",
  domain: "https://oncall.auth.us-east-1.amazoncognito.com",
};

function user(profile: Record<string, unknown>, expiresInSeconds = 3600) {
  return new User({
    access_token: "at",
    token_type: "Bearer",
    profile: { sub: "sub-1", iss: config.authority, aud: "client123", exp: 0, iat: 0, ...profile },
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
}

describe("oidcSettings", () => {
  it("uses <origin>/callback, the code flow and PKCE on a secure origin", () => {
    expect(oidcSettings(config, "https://app.example", true)).toMatchObject({
      authority: config.authority,
      client_id: "client123",
      redirect_uri: "https://app.example/callback",
      response_type: "code",
      scope: "openid email profile",
      automaticSilentRenew: true,
      disablePKCE: false,
    });
  });

  it("uses the registered bounce URL and no PKCE on the HTTP S3 website (D-25)", () => {
    const settings = oidcSettings(
      { ...config, redirectUri: "https://b.s3.us-east-1.amazonaws.com/auth/callback.html" },
      "http://b.s3-website-us-east-1.amazonaws.com",
      false,
    );
    expect(settings.redirect_uri).toBe("https://b.s3.us-east-1.amazonaws.com/auth/callback.html");
    expect(settings.disablePKCE).toBe(true);
  });
});

describe("logoutUrl", () => {
  it("builds Cognito's /logout with client_id and logout_uri", () => {
    const url = new URL(logoutUrl(config, "https://app.example"));
    expect(url.origin + url.pathname).toBe(`${config.domain}/logout`);
    expect(url.searchParams.get("client_id")).toBe("client123");
    expect(url.searchParams.get("logout_uri")).toBe("https://app.example/");
  });

  it("prefers the configured logout URI", () => {
    const url = new URL(logoutUrl({ ...config, logoutUri: "https://x.example/out.html" }));
    expect(url.searchParams.get("logout_uri")).toBe("https://x.example/out.html");
  });
});

describe("toCurrentUser", () => {
  it("returns sub and cognito:username", () => {
    expect(toCurrentUser(user({ "cognito:username": "alice" }))).toEqual({
      userId: "sub-1",
      username: "alice",
    });
  });

  it("falls back to sub, and is null when signed out or expired", () => {
    expect(toCurrentUser(user({}))?.username).toBe("sub-1");
    expect(toCurrentUser(null)).toBeNull();
    expect(toCurrentUser(user({ "cognito:username": "alice" }, -10))).toBeNull();
  });
});

describe("returnToFromState", () => {
  it.each([
    [{ returnTo: "/sessions/1" }, "/sessions/1"],
    [{ returnTo: 3 }, null],
    [undefined, null],
    ["x", null],
  ])("%j → %s", (state, expected) => {
    expect(returnToFromState(state)).toBe(expected);
  });
});
