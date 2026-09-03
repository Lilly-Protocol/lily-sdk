import { describe, it, expect } from "vitest";
import { verifyWebhookJSON, verifyWebhookSignature } from "../src/webhooks";
import { createHmac } from "node:crypto";

const SECRET = "whsec_test_secret_12345";

describe("verifyWebhookJSON canonical serialization (issue #436)", () => {
  it("accepts signature from differently-key-ordered JSON", () => {
    const dataA = { a: 1, b: 2 };
    const dataB = { b: 2, a: 1 };
    const sigA = createHmac("sha256", SECRET)
      .update(JSON.stringify(dataA))
      .digest("hex");
    // Sign with one order, verify with another
    expect(verifyWebhookJSON(dataB, sigA, SECRET)).toBe(true);
  });

  it("handles nested objects with different key orders", () => {
    const dataA = { outer: { z: 3, a: 1 }, inner: [1, 2] };
    const dataB = { inner: [1, 2], outer: { a: 1, z: 3 } };
    const sigA = createHmac("sha256", SECRET)
      .update(JSON.stringify(dataA))
      .digest("hex");
    expect(verifyWebhookJSON(dataB, sigA, SECRET)).toBe(true);
  });

  it("still rejects tampered payloads", () => {
    const data = { event: "test" };
    const sig = createHmac("sha256", SECRET)
      .update(JSON.stringify(data))
      .digest("hex");
    expect(verifyWebhookJSON({ event: "tampered" }, sig, SECRET)).toBe(false);
  });

  it("handles arrays deterministically", () => {
    const data = { items: [3, 1, 2] };
    const sig = createHmac("sha256", SECRET)
      .update(JSON.stringify(data))
      .digest("hex");
    expect(verifyWebhookJSON(data, sig, SECRET)).toBe(true);
  });

  it("handles primitive values", () => {
    expect(verifyWebhookJSON("hello", createHmac("sha256", SECRET).update('"hello"').digest("hex"), SECRET)).toBe(true);
    expect(verifyWebhookJSON(42, createHmac("sha256", SECRET).update("42").digest("hex"), SECRET)).toBe(true);
    expect(verifyWebhookJSON(true, createHmac("sha256", SECRET).update("true").digest("hex"), SECRET)).toBe(true);
  });
});