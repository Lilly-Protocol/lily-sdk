import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { LilySdk } from "../src/sdk.js";

describe("LilySdk.create() factory (issue #115)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("uses explicit options over environment variables", () => {
    process.env.LILY_API_URL = "https://env.example.com";
    process.env.LILY_API_KEY = "env-key";

    const sdk = LilySdk.create({
      baseUrl: "https://explicit.example.com",
      apiKey: "explicit-key",
    });

    expect(sdk.config.baseUrl.toString()).toBe("https://explicit.example.com/");
    expect(sdk.config.apiKey).toBe("explicit-key");
  });

  it("falls back to LILY_API_URL and LILY_API_KEY env vars", () => {
    process.env.LILY_API_URL = "https://fallback.example.com";
    process.env.LILY_API_KEY = "fallback-key";

    const sdk = LilySdk.create();

    expect(sdk.config.baseUrl.toString()).toBe("https://fallback.example.com/");
    expect(sdk.config.apiKey).toBe("fallback-key");
  });

  it("throws when neither options nor env provide baseUrl", () => {
    delete process.env.LILY_API_URL;

    expect(() => LilySdk.create()).toThrow(/baseUrl is required/i);
  });

  it("works with only apiKey in config and baseUrl in env", () => {
    process.env.LILY_API_URL = "https://mixed.example.com";
    delete process.env.LILY_API_KEY;

    const sdk = LilySdk.create({ apiKey: "mixed-key" });

    expect(sdk.config.baseUrl.toString()).toBe("https://mixed.example.com/");
    expect(sdk.config.apiKey).toBe("mixed-key");
  });
});
