import { describe, it, expect, vi } from "vitest";
import { resolveLilySdkConfig } from "../src/config/resolve-config";

describe("baseUrl env-var fallback (issue #444)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("reads LILY_API_URL when set", () => {
    process.env.LILY_API_URL = "https://api.test.com";
    const config = resolveLilySdkConfig({ apiKey: "key" });
    expect(config.baseUrl.toString()).toBe("https://api.test.com/");
  });

  it("reads LILY_BASE_URL when LILY_API_URL is not set", () => {
    delete process.env.LILY_API_URL;
    process.env.LILY_BASE_URL = "https://base.test.com";
    const config = resolveLilySdkConfig({ apiKey: "key" });
    expect(config.baseUrl.toString()).toBe("https://base.test.com/");
  });

  it("prefers LILY_API_URL over LILY_BASE_URL", () => {
    process.env.LILY_API_URL = "https://api.test.com";
    process.env.LILY_BASE_URL = "https://base.test.com";
    const config = resolveLilySdkConfig({ apiKey: "key" });
    expect(config.baseUrl.toString()).toBe("https://api.test.com/");
  });

  it("explicit baseUrl overrides env vars", () => {
    process.env.LILY_API_URL = "https://api.test.com";
    const config = resolveLilySdkConfig({ baseUrl: "https://explicit.com", apiKey: "key" });
    expect(config.baseUrl.toString()).toBe("https://explicit.com/");
  });

  it("throws when no baseUrl is provided and no env var is set", () => {
    delete process.env.LILY_API_URL;
    delete process.env.LILY_BASE_URL;
    expect(() => resolveLilySdkConfig({ apiKey: "key" })).toThrow("baseUrl");
  });
});