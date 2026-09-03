import { describe, it, expect } from "vitest";
import * as sdk from "../../src/index.js";

describe("LilyValidationError removal (issue #111)", () => {
  it("does not export LilyValidationError", () => {
    expect("LilyValidationError" in sdk).toBe(false);
  });

  it("still exports core error classes", () => {
    expect(sdk.LilySdkError).toBeDefined();
    expect(sdk.LilyConfigError).toBeDefined();
    expect(sdk.LilyTransportError).toBeDefined();
    expect(sdk.LilyAuthenticationError).toBeDefined();
    expect(sdk.LilyApiError).toBeDefined();
  });
});
