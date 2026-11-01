import { http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { setAuthHeadersProvider } from "./auth-headers";
import { api, REQUEST_ID_HEADER, unwrap } from "./client";
import { ApiError } from "./errors";

describe("api client", () => {
  afterEach(() => setAuthHeadersProvider(() => ({})));

  it("sends a ULID request id and the auth headers", async () => {
    let seen: Headers | undefined;
    server.use(
      http.get("*/api/scenarios", ({ request }) => {
        seen = request.headers;
        return HttpResponse.json([]);
      }),
    );
    setAuthHeadersProvider(() => ({ "x-dev-user": "alice" }));

    await unwrap(api.GET("/api/scenarios"));

    expect(seen?.get(REQUEST_ID_HEADER)).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(seen?.get("x-dev-user")).toBe("alice");
  });

  it("turns error responses into ApiError, falling back to the request id header", async () => {
    server.use(
      http.get("*/api/scenarios/:id", () =>
        HttpResponse.json(
          { error: { code: "NOT_FOUND", message: "Scenario not found", requestId: "01JREQ" } },
          { status: 404 },
        ),
      ),
    );
    await expect(
      unwrap(api.GET("/api/scenarios/{scenarioId}", { params: { path: { scenarioId: "nope" } } })),
    ).rejects.toMatchObject({ status: 404, code: "NOT_FOUND", requestId: "01JREQ" });
  });

  it("turns network failures into a NETWORK_ERROR ApiError", async () => {
    server.use(http.get("*/api/scenarios", () => HttpResponse.error()));
    const promise = unwrap(api.GET("/api/scenarios"));
    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({ status: 0, code: "NETWORK_ERROR" });
  });
});
