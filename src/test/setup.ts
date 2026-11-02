import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { server } from "@/mocks/node";
import { simulator } from "@/mocks/handlers";

// jsdom has no ResizeObserver; Carbon's Dropdown and Modal need one.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  simulator.reset();
});
afterAll(() => server.close());
