import { describe, expect, it, vi } from "vitest";
import { DEFAULT_TIMEOUT_MS, DEFAULT_RETRY_POLICY, DEFAULT_RETRYABLE_STATUS_CODES } from "../src/config/defaults";
import { resolveLilySdkConfig } from "../src/config/resolve-config";

describe("shared-defaults", () => {
  it("exports DEFAULT_TIMEOUT_MS", () => {
    expect(DEFAULT_TIMEOUT_MS).toBe(10_000);
  });

  it("exports DEFAULT_RETRY_POLICY", () => {
    expect(DEFAULT_RETRY_POLICY.retries).toBe(2);
    expect(DEFAULT_RETRY_POLICY.retryDelayMs).toBe(250);
  });

  it("exports DEFAULT_RETRYABLE_STATUS_CODES equal to policy codes", () => {
    expect(DEFAULT_RETRYABLE_STATUS_CODES).toEqual(DEFAULT_RETRY_POLICY.retryableStatusCodes);
  });

  it("resolveLilySdkConfig uses shared defaults", () => {
    process.env.LILY_API_URL = "https://api.example.com";
    const config = resolveLilySdkConfig({});
    expect(config.timeoutMs).toBe(DEFAULT_TIMEOUT_MS);
    expect(config.retry.retries).toBe(DEFAULT_RETRY_POLICY.retries);
  });

  it("resolveLilySdkConfig supports LILY_BASE_URL fallback", () => {
    delete process.env.LILY_API_URL;
    process.env.LILY_BASE_URL = "https://base-url.example.com";
    const config = resolveLilySdkConfig({});
    expect(config.baseUrl.toString()).toBe("https://base-url.example.com/");
  });

  it("LILY_API_URL takes precedence over LILY_BASE_URL", () => {
    process.env.LILY_API_URL = "https://api.example.com";
    process.env.LILY_BASE_URL = "https://base.example.com";
    const config = resolveLilySdkConfig({});
    expect(config.baseUrl.toString()).toBe("https://api.example.com/");
  });
});
