import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/** Started from main.tsx only in dev with VITE_API_MOCKS=true. The worker script is served by
 * the msw Vite plugin, so nothing is committed to public/. */
export async function startMockWorker(): Promise<void> {
  await setupWorker(...handlers).start({ onUnhandledFrame: "bypass", quiet: true });
}
