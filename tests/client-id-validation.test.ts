import { describe, expect, it, vi } from "vitest";
import { AgentClient } from "../src/clients/agent-client";
import { WalletClient } from "../src/clients/wallet-client";
import { PaymentClient } from "../src/clients/payment-client";
import { LilyValidationError } from "../src/errors/sdk-error";
import { createMockHttpClient } from "./helpers/mock-http-client";

describe("client-id-validation", () => {
  it("agent.get rejects empty string", () => {
    const c = new AgentClient(createMockHttpClient(() => Promise.resolve({ status: 200, headers: new Headers(), data: null })));
    expect(() => c.get("")).toThrow(LilyValidationError);
    expect(() => c.get("  ")).toThrow(LilyValidationError);
  });

  it("agent.update rejects empty string", () => {
    const c = new AgentClient(createMockHttpClient(() => Promise.resolve({ status: 200, headers: new Headers(), data: null })));
    expect(() => c.update("", { name: "x" })).toThrow(LilyValidationError);
  });

  it("agent.delete rejects empty string", () => {
    const c = new AgentClient(createMockHttpClient(() => Promise.resolve({ status: 200, headers: new Headers(), data: null })));
    expect(() => c.delete("")).toThrow(LilyValidationError);
  });

  it("wallet.get rejects empty string", () => {
    const c = new WalletClient(createMockHttpClient(() => Promise.resolve({ status: 200, headers: new Headers(), data: null })));
    expect(() => c.get("")).toThrow(LilyValidationError);
  });

  it("payment.get rejects empty string", () => {
    const c = new PaymentClient(createMockHttpClient(() => Promise.resolve({ status: 200, headers: new Headers(), data: null })));
    expect(() => c.get("")).toThrow(LilyValidationError);
  });

  it("non-empty ids are unaffected", async () => {
    const spy = vi.fn().mockResolvedValue({ status: 200, headers: new Headers(), data: { id: "a1" } });
    const c = new AgentClient(createMockHttpClient(spy));
    await c.get("agent_123");
    expect(spy).toHaveBeenCalledOnce();
  });
});
