# Security Policy

## Supported Versions

The following versions of `@lily-protocol/sdk` receive security updates:

| Version | Supported |
| ------- | ---------- |
| 0.1.x   | ✅        |
| < 0.1.0 | ❌        |

## Reporting a Vulnerability

If you discover a security vulnerability in the Lily Protocol SDK, please report it responsibly:

1. **Email** your findings to `security@lily-protocol.dev`.
2. Include a clear description of the issue, steps to reproduce, and the potential impact.
3. If possible, provide a proof-of-concept.

### Response Timeline

| Step | Target |
| ---- | ------ |
| Acknowledgement of report | 48 hours |
| Initial assessment | 5 business days |
| Fix or mitigation | 30 days (severity-dependent) |

## Coordinated Disclosure

- Please **do not** disclose the vulnerability publicly until a fix has been released.
- We will credit reporters in the release notes unless you prefer to remain anonymous.
- We follow a **90-day disclosure deadline** from the initial report. If a fix is not released within 90 days, the reporter may publish details of the vulnerability.

## Scope

**In scope:**
- The `@lily-protocol/sdk` TypeScript source code in this repository.
- The published npm package matching a release tag.

**Out of scope:**
- Third-party dependencies (report to the upstream maintainer).
- The Lily Protocol backend API (report to `security@lily-protocol.dev` with "Backend" in the subject).
- Social engineering, phishing, or physical attacks.

## Bounty Rewards

We offer monetary rewards for confirmed security vulnerabilities:

| Severity (CVSS) | Reward |
| --------------- | ------ |
| Critical (9.0–10.0) | $500 |
| High (7.0–8.9) | $250 |
| Medium (4.0–6.9) | $100 |
| Low (0.1–3.9) | $50 |

Rewards are paid via PayPal or cryptocurrency at the reporter's preference.
