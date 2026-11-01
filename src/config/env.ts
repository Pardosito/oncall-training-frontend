import { z } from "zod";

// Every VITE_* value is public: it's baked into the bundle (DECISIONS D-11).
const baseSchema = z.object({
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
});

const envSchema = z
  .discriminatedUnion("VITE_AUTH_MODE", [devAuthSchema, cognitoAuthSchema])
  .and(baseSchema);

export type Env =
  | {
      authMode: "dev";
      devUser: string;
      apiMocks: boolean;
    }
  | {
      authMode: "cognito";
      cognito: { authority: string; clientId: string; domain: string };
      apiMocks: boolean;
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
  if (data.VITE_AUTH_MODE === "dev") {
    return { authMode: "dev", devUser: data.VITE_DEV_USER, apiMocks: data.VITE_API_MOCKS };
  }
  return {
    authMode: "cognito",
    cognito: {
      authority: data.VITE_COGNITO_AUTHORITY,
      clientId: data.VITE_COGNITO_CLIENT_ID,
      domain: data.VITE_COGNITO_DOMAIN.replace(/\/$/, ""),
    },
    apiMocks: data.VITE_API_MOCKS,
  };
}

let cached: Env | undefined;

/** The validated env. Throws `EnvError` on first use if it's invalid (main.tsx shows it). */
export function getEnv(): Env {
  cached ??= parseEnv(import.meta.env);
  return cached;
}
