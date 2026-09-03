import { describe, it, expect } from "vitest";
import * as errors from "../src/errors";

describe("error exports surface", () => {
  it("exports LilyValidationError from ./errors subpath", () => {
    expect(Object.prototype.hasOwnProperty.call(errors, "LilyValidationError")).toBe(true);
  });

  it("exports isLilySdkError from ./errors subpath", () => {
    expect(Object.prototype.hasOwnProperty.call(errors, "isLilySdkError")).toBe(true);
  });

  it("exports core error classes", () => {
    expect(errors.LilySdkError).toBeDefined();
    expect(errors.LilyConfigError).toBeDefined();
    expect(errors.LilyTransportError).toBeDefined();
    expect(errors.LilyAuthenticationError).toBeDefined();
    expect(errors.LilyApiError).toBeDefined();
  });

  it("isLilySdkError type guard works correctly", () => {
    expect(errors.isLilySdkError(new errors.LilySdkError("test"))).toBe(true);
    expect(errors.isLilySdkError("not an error")).toBe(false);
    expect(errors.isLilySdkError(null)).toBe(false);
  });
});
