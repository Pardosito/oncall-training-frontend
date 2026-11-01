import { EnvError, parseEnv } from "./env";

const cognito = {
  VITE_AUTH_MODE: "cognito",
  VITE_COGNITO_AUTHORITY: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_AbC123",
  VITE_COGNITO_CLIENT_ID: "abc",
  VITE_COGNITO_DOMAIN: "https://oncall.auth.us-east-1.amazoncognito.com/",
};

describe("parseEnv", () => {
  it("accepts dev auth with a dev user", () => {
    expect(parseEnv({ VITE_AUTH_MODE: "dev", VITE_DEV_USER: "alice" })).toEqual({
      authMode: "dev",
      devUser: "alice",
      apiMocks: false,
    });
  });

  it("accepts cognito and trims the trailing slash of the domain", () => {
    const env = parseEnv({ ...cognito, VITE_API_MOCKS: "true" });
    expect(env).toMatchObject({
      authMode: "cognito",
      apiMocks: true,
      cognito: { domain: "https://oncall.auth.us-east-1.amazoncognito.com" },
    });
  });

  it("defaults to cognito, so missing Cognito vars are reported", () => {
    expect(() => parseEnv({})).toThrow(EnvError);
  });

  it("requires VITE_DEV_USER in dev mode", () => {
    try {
      parseEnv({ VITE_AUTH_MODE: "dev" });
      expect.fail("should throw");
    } catch (error) {
      expect((error as EnvError).keys).toEqual(["VITE_DEV_USER"]);
    }
  });

  it("lists only key names, never values", () => {
    try {
      parseEnv({ ...cognito, VITE_COGNITO_AUTHORITY: "not-a-url-secretish" });
      expect.fail("should throw");
    } catch (error) {
      expect((error as EnvError).keys).toEqual(["VITE_COGNITO_AUTHORITY"]);
      expect((error as EnvError).message).not.toContain("secretish");
    }
  });

  it("rejects an unknown auth mode", () => {
    expect(() => parseEnv({ VITE_AUTH_MODE: "magic" })).toThrow(EnvError);
  });
});
