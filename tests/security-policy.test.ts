import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

describe("security policy", () => {
  it("ships SECURITY.md with a private GitHub advisory reporting channel", () => {
    const policy = readFileSync(path.join(root, "SECURITY.md"), "utf8");

    expect(policy).toMatch(/# Security Policy/);
    expect(policy).toMatch(/GitHub Security Advisories/i);
    expect(policy).toMatch(
      "https://github.com/Lilly-Protocol/lily-sdk/security/advisories/new",
    );
    expect(policy).toMatch(/3 business days/);
  });

  it("links the policy from the README", () => {
    const readme = readFileSync(path.join(root, "README.md"), "utf8");

    expect(readme).toMatch(/\[SECURITY\.md\]\(\.\/SECURITY\.md\)/);
  });
});
