import { describe, it, expect, vi } from "vitest";
import { LilySdk } from "../src/sdk";

describe("LilySdk.withConfig request routing (issue #405)", () => {
  it("routes requests through overridden baseUrl and credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    const sdk = new LilySdk({
      baseUrl: "https://api.example.com",
      apiKey: "base-key",
    });
    // Replace the default fetch with our mock
    const derived = sdk.withConfig({
      baseUrl: "https://tenant.example.com",
      apiKey: "tenant-key",
    });
    // Inject mock fetch into derived config
    derived.config.fetch = fetchMock as typeof globalThis.fetch;
    await derived.agents.list();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    expect((call[0] as URL).hostname).toBe("tenant.example.com");
    const headers = call[1] as RequestInit;
    expect(headers.headers).toMatchObject({ "x-api-key": "tenant-key" });
  });

  it("original instance still routes to its own baseUrl", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    const sdk = new LilySdk({
      baseUrl: "https://api.example.com",
      apiKey: "base-key",
    });
    sdk.config.fetch = fetchMock as typeof globalThis.fetch;
    await sdk.agents.list();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const call = fetchMock.mock.calls[0];
    expect((call[0] as URL).hostname).toBe("api.example.com");
  });
});