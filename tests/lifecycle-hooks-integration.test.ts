import { describe, it, expect, vi } from "vitest";
import { createFetchHttpClient } from "../src/http/fetch-http-client";
import type { ResolvedLilySdkConfig } from "../src/config/types";
import type { RequestLifecycleHooks } from "../src/http/lifecycle-hooks";

function makeConfig(overrides: Partial<ResolvedLilySdkConfig> = {}): ResolvedLilySdkConfig {
  return {
    baseUrl: new URL("https://api.example.com"),
    apiKey: "test-key",
    authToken: undefined,
    userAgent: "lily-sdk/test",
    defaultHeaders: {},
    timeoutMs: 1000,
    retry: { retries: 2, retryDelayMs: 10 },
    fetch: vi.fn(),
    ...overrides,
  } as ResolvedLilySdkConfig;
}

function jsonResponse(body: unknown, status = 200) {
  return () => new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function jsonErrorResponse(status: number, body: unknown) {
  return () => new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("lifecycle hooks integration (issue #409)", () => {
  it("calls beforeRequest then afterResponse for a 200 response", async () => {
    const calls: string[] = [];
    const hooks: RequestLifecycleHooks = {
      beforeRequest: () => calls.push("beforeRequest"),
      afterResponse: () => calls.push("afterResponse"),
    };
    const config = makeConfig({ fetch: vi.fn().mockImplementation(jsonResponse({ ok: true })) });
    const client = createFetchHttpClient(config, hooks);
    await client.request({ method: "GET", path: "/v1/agents" });
    expect(calls).toEqual(["beforeRequest", "afterResponse"]);
  });

  it("calls onRetry on a 429-then-success flow", async () => {
    const calls: string[] = [];
    const hooks: RequestLifecycleHooks = {
      onRetry: () => calls.push("onRetry"),
      afterResponse: () => calls.push("afterResponse"),
    };
    const mockFetch = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 429, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } }));
    const config = makeConfig({ fetch: mockFetch, retry: { retries: 2, retryDelayMs: 1 } });
    const client = createFetchHttpClient(config, hooks);
    await client.request({ method: "GET", path: "/v1/agents" });
    expect(calls).toContain("onRetry");
    expect(calls).toContain("afterResponse");
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("calls onError on a terminal 4xx failure", async () => {
    const calls: string[] = [];
    const hooks: RequestLifecycleHooks = {
      onError: () => calls.push("onError"),
    };
    const config = makeConfig({ fetch: vi.fn().mockImplementation(jsonErrorResponse(400, { error: "bad" })) });
    const client = createFetchHttpClient(config, hooks);
    await expect(client.request({ method: "GET", path: "/v1/agents" })).rejects.toThrow();
    expect(calls).toContain("onError");
  });

  it("a throwing hook does not reject the underlying request", async () => {
    const hooks: RequestLifecycleHooks = {
      beforeRequest: () => { throw new Error("hook boom"); },
      afterResponse: () => {},
    };
    const config = makeConfig({ fetch: vi.fn().mockImplementation(jsonResponse({ ok: true })) });
    const client = createFetchHttpClient(config, hooks);
    const result = await client.request({ method: "GET", path: "/v1/agents" });
    expect(result.status).toBe(200);
  });
});