import { describe, it, expect, vi } from "vitest";
import { createFetchHttpClient } from "../src/http/fetch-http-client";
import type { ResolvedLilySdkConfig } from "../src/config/types";
import { LilyConfigError } from "../src/errors/sdk-error";

function makeConfig(overrides: Partial<ResolvedLilySdkConfig> = {}): ResolvedLilySdkConfig {
  return {
    baseUrl: new URL("https://api.example.com"),
    apiKey: "test-key",
    authToken: undefined,
    userAgent: "lily-sdk/test",
    defaultHeaders: {},
    timeoutMs: 10000,
    retry: { retries: 2, retryDelayMs: 10 },
    fetch: vi.fn(),
    ...overrides,
  } as ResolvedLilySdkConfig;
}

describe("per-request timeoutMs validation (issue #446)", () => {
  it("rejects negative timeoutMs without hitting fetch", async () => {
    const config = makeConfig();
    const client = createFetchHttpClient(config);
    await expect(client.request({ method: "GET", path: "/test", timeoutMs: -1 })).rejects.toThrow(LilyConfigError);
    expect(config.fetch).not.toHaveBeenCalled();
  });

  it("rejects NaN timeoutMs without hitting fetch", async () => {
    const config = makeConfig();
    const client = createFetchHttpClient(config);
    await expect(client.request({ method: "GET", path: "/test", timeoutMs: NaN })).rejects.toThrow(LilyConfigError);
    expect(config.fetch).not.toHaveBeenCalled();
  });

  it("rejects Infinity timeoutMs without hitting fetch", async () => {
    const config = makeConfig();
    const client = createFetchHttpClient(config);
    await expect(client.request({ method: "GET", path: "/test", timeoutMs: Infinity })).rejects.toThrow(LilyConfigError);
    expect(config.fetch).not.toHaveBeenCalled();
  });

  it("rejects string timeoutMs without hitting fetch", async () => {
    const config = makeConfig();
    const client = createFetchHttpClient(config);
    await expect(client.request({ method: "GET", path: "/test", timeoutMs: "5000" as unknown as number })).rejects.toThrow(LilyConfigError);
    expect(config.fetch).not.toHaveBeenCalled();
  });

  it("allows timeoutMs of 0 (opt-out)", async () => {
    const config = makeConfig();
    const client = createFetchHttpClient(config);
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } })
    );
    config.fetch = mockFetch;
    await client.request({ method: "GET", path: "/test", timeoutMs: 0 });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("allows valid positive timeoutMs", async () => {
    const config = makeConfig();
    const client = createFetchHttpClient(config);
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } })
    );
    config.fetch = mockFetch;
    await client.request({ method: "GET", path: "/test", timeoutMs: 5000 });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});