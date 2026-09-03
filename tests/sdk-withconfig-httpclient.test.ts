import { describe, it, expect, vi } from "vitest";
import { LilySdk } from "../src/sdk";
import type { HttpClient } from "../src/http/types";

describe("withConfig preserves injected HttpClient (issue #442)", () => {
  it("routes child requests through parent's injected HttpClient", async () => {
    const mockClient: HttpClient = {
      request: vi.fn().mockResolvedValue({
        status: 200,
        data: { ok: true },
        headers: new Headers(),
      }),
    };
    const sdk = new LilySdk(
      { baseUrl: "https://api.example.com", apiKey: "base-key" },
      mockClient
    );
    const child = sdk.withConfig({ apiKey: "child-key" });
    await child.agents.list();
    expect(mockClient.request).toHaveBeenCalledTimes(1);
  });

  it("original SDK still uses the same injected client", async () => {
    const mockClient: HttpClient = {
      request: vi.fn().mockResolvedValue({
        status: 200,
        data: { ok: true },
        headers: new Headers(),
      }),
    };
    const sdk = new LilySdk(
      { baseUrl: "https://api.example.com", apiKey: "base-key" },
      mockClient
    );
    await sdk.agents.list();
    expect(mockClient.request).toHaveBeenCalledTimes(1);
  });
});