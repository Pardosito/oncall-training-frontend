import { z } from "zod";

// Every VITE_* value is public: it's baked into the bundle (DECISIONS D-11).
const optionalUrl = z.preprocess((v) => (v === "" ? undefined : v), z.url().optional());

const baseSchema = z.object({
  // The API's origin when it isn't same-origin (D-25: SPA on S3, API on the ALB). Unset: same origin.
  VITE_API_BASE_URL: optionalUrl,
  VITE_API_MOCKS: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

const devAuthSchema = z.object({
  VITE_AUTH_MODE: z.literal("dev"),
  VITE_DEV_USER: z.string().trim().min(1),
});

const cognitoAuthSchema = z.object({
  VITE_AUTH_MODE: z.literal("cognito"),
  VITE_COGNITO_AUTHORITY: z.url(),
  VITE_COGNITO_CLIENT_ID: z.string().trim().min(1),
  VITE_COGNITO_DOMAIN: z.url(),
  VITE_COGNITO_REDIRECT_URI: optionalUrl,
  VITE_COGNITO_LOGOUT_URI: optionalUrl,
});

const envSchema = z
  .discriminatedUnion("VITE_AUTH_MODE", [devAuthSchema, cognitoAuthSchema])
  .and(baseSchema);

export type Env =
  | {
      authMode: "dev";
      devUser: string;
      apiMocks: boolean;
      apiBaseUrl?: string;
    }
  | {
      authMode: "cognito";
      cognito: {
        authority: string;
        clientId: string;
        domain: string;
        /** Registered callback when it isn't `<origin>/callback` (D-25: HTTPS bounce page). */
        redirectUri?: string;
        /** Registered sign-out URL when it isn't `<origin>/` (D-25). */
        logoutUri?: string;
      };
      apiMocks: boolean;
      apiBaseUrl?: string;
    };

export class EnvError extends Error {
  /** Names of the invalid variables. Values are never included. */
  readonly keys: string[];

  constructor(keys: string[]) {
    super(`Invalid configuration: ${keys.join(", ")}`);
    this.name = "EnvError";
    this.keys = keys;
  }
}

export function parseEnv(raw: Record<string, unknown>): Env {
  const input = { VITE_AUTH_MODE: "cognito", ...raw };
  const result = envSchema.safeParse(input);
  if (!result.success) {
    const keys = [...new Set(result.error.issues.map((issue) => String(issue.path[0] ?? "env")))];
    throw new EnvError(keys);
  }
  const data = result.data;
  const apiBaseUrl = data.VITE_API_BASE_URL?.replace(/\/$/, "");
  const base = { apiMocks: data.VITE_API_MOCKS, ...(apiBaseUrl ? { apiBaseUrl } : {}) };
  if (data.VITE_AUTH_MODE === "dev") {
    return { authMode: "dev", devUser: data.VITE_DEV_USER, ...base };
  }
  return {
    authMode: "cognito",
    cognito: {
      authority: data.VITE_COGNITO_AUTHORITY,
      clientId: data.VITE_COGNITO_CLIENT_ID,
      domain: data.VITE_COGNITO_DOMAIN.replace(/\/$/, ""),
      ...(data.VITE_COGNITO_REDIRECT_URI ? { redirectUri: data.VITE_COGNITO_REDIRECT_URI } : {}),
      ...(data.VITE_COGNITO_LOGOUT_URI ? { logoutUri: data.VITE_COGNITO_LOGOUT_URI } : {}),
    },
    ...base,
  };
}

let cached: Env | undefined;

/** The validated env. Throws `EnvError` on first use if it's invalid (main.tsx shows it). */
export function getEnv(): Env {
  cached ??= parseEnv(import.meta.env);
  return cached;
}
