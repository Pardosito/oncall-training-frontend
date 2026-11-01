/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { msw } from "msw/vite";
import { defineConfig, loadEnv, type Plugin } from "vite";

/**
 * Production builds must never ship dev auth or the in-browser mocks (ARCHITECTURE §4, FE-018).
 */
function refuseDevOnlyFlagsInBuild(env: Record<string, string>): Plugin {
  return {
    name: "refuse-dev-only-flags-in-build",
    apply: "build",
    configResolved(config) {
      if (config.mode === "test") return;
      if (env.VITE_AUTH_MODE === "dev" || env.VITE_API_MOCKS === "true") {
        throw new Error(
          "Production builds can't use VITE_AUTH_MODE=dev or VITE_API_MOCKS=true. Unset them and build again.",
        );
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ""), ...process.env } as Record<string, string>;
  // Where `pnpm dev` proxies /api. Not a VITE_* var: it never reaches the bundle (DECISIONS D-18, FE-125).
  const apiProxyTarget = env.API_PROXY_TARGET ?? "http://localhost:3000";

  return {
    plugins: [react(), msw({ mode: "worker-only" }), refuseDevOnlyFlagsInBuild(env)],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": { target: apiProxyTarget, changeOrigin: true },
      },
    },
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
      css: false,
      include: ["src/**/*.test.{ts,tsx}"],
      env: { VITE_AUTH_MODE: "dev", VITE_DEV_USER: "test-user" },
    },
  };
});
