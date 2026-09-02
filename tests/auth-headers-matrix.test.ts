import { describe, it, expect, vi } from "vitest";
import { createFetchHttpClient } from "../src/http/fetch-http-client.js";

describe("auth headers matrix (issue #121)", () => {
  const baseConfig = {
    baseUrl: new URL("https://api.lily.test/"),
    timeoutMs: 2_000,
    retry: { retries: 0, retryDelayMs: 0, retryableStatusCodes: [] },
    defaultHeaders: {},
    userAgent: "lily-sdk/test",
  };

  it("sends only x-api-key when apiKey is configured", async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }))
    );

    const client = createFetchHttpClient({ ...baseConfig, apiKey: "test-key", fetch: fetchSpy });
    await client.request({ method: "GET", path: "/v1/test" });

    expect(fetchSpy).toHaveBeenCalled();
    const calls = fetchSpy.mock.calls as unknown as [unknown, Record<string, unknown>?][];
    const init = calls[0]?.[1];
    const headers = init?.headers as Record<string, string> | undefined;
    expect(headers?.["x-api-key"]).toBe("test-key");
    expect(headers?.authorization).toBeUndefined();
  });

  it("sends only Bearer token when authToken is configured", async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }))
    );

    const client = createFetchHttpClient({ ...baseConfig, authToken: "test-token", fetch: fetchSpy });
    await client.request({ method: "GET", path: "/v1/test" });

    expect(fetchSpy).toHaveBeenCalled();
    const calls = fetchSpy.mock.calls as unknown as [unknown, Record<string, unknown>?][];
    const init = calls[0]?.[1];
    const headers = init?.headers as Record<string, string> | undefined;
    expect(headers?.authorization).toBe("Bearer test-token");
    expect(headers?.["x-api-key"]).toBeUndefined();
  });

  it("sends both headers when apiKey and authToken are configured", async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }))
    );

    const client = createFetchHttpClient({ ...baseConfig, apiKey: "both-key", authToken: "both-token", fetch: fetchSpy });
    await client.request({ method: "GET", path: "/v1/test" });

    expect(fetchSpy).toHaveBeenCalled();
    const calls = fetchSpy.mock.calls as unknown as [unknown, Record<string, unknown>?][];
    const init = calls[0]?.[1];
    const headers = init?.headers as Record<string, string> | undefined;
    expect(headers?.["x-api-key"]).toBe("both-key");
    expect(headers?.authorization).toBe("Bearer both-token");
  });

  it("sends neither header when no credentials are configured", async () => {
    const fetchSpy = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }))
    );

    const client = createFetchHttpClient({ ...baseConfig, fetch: fetchSpy });
    await client.request({ method: "GET", path: "/v1/test" });

    expect(fetchSpy).toHaveBeenCalled();
    const calls = fetchSpy.mock.calls as unknown as [unknown, Record<string, unknown>?][];
    const init = calls[0]?.[1];
    const headers = init?.headers as Record<string, string> | undefined;
    expect(headers?.["x-api-key"]).toBeUndefined();
    expect(headers?.authorization).toBeUndefined();
  });
});
