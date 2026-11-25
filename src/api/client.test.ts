import { http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { setAuthHeadersProvider, setUnauthorizedHandler } from "./auth-headers";
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

describe("api client 401 handling (FE-027)", () => {
  afterEach(() => {
    setAuthHeadersProvider(() => ({}));
    setUnauthorizedHandler(undefined);
  });

  it("renews once for concurrent 401s and replays each request with the new token", async () => {
    let token = "old";
    const seen: string[] = [];
    server.use(
      http.get("*/api/scenarios", ({ request }) => {
        const auth = request.headers.get("authorization") ?? "";
        seen.push(auth);
        return auth === "Bearer new"
          ? HttpResponse.json([])
          : HttpResponse.json({ error: { code: "UNAUTHORIZED", message: "no" } }, { status: 401 });
      }),
    );
    setAuthHeadersProvider(() => ({ authorization: `Bearer ${token}` }));
    const renew = vi.fn(() => {
      token = "new";
      return Promise.resolve(true);
    });
    setUnauthorizedHandler(renew);

    await Promise.all([unwrap(api.GET("/api/scenarios")), unwrap(api.GET("/api/scenarios"))]);

    expect(renew).toHaveBeenCalledTimes(1);
    expect(seen.filter((h) => h === "Bearer new")).toHaveLength(2);
  });

  it("returns the 401 when the renew fails", async () => {
    server.use(
      http.get("*/api/scenarios", () =>
        HttpResponse.json({ error: { code: "UNAUTHORIZED", message: "no" } }, { status: 401 }),
      ),
    );
    setUnauthorizedHandler(() => Promise.resolve(false));
    await expect(unwrap(api.GET("/api/scenarios"))).rejects.toMatchObject({ status: 401 });
  });
});
