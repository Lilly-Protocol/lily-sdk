# Security Policy

Lily SDK talks to payment execution, wallet provisioning, and identity APIs.
Please report vulnerabilities privately so they can be fixed before public
disclosure.

## Supported versions

| Version | Supported |
| ------- | --------- |
| `main` (unreleased) | Yes |
| Published npm releases of `@lily-protocol/sdk` | Yes, until a patched release is published |
| Forks and unmodified vendored copies | No |

## Reporting a vulnerability

Use GitHub Security Advisories for this repository:

https://github.com/Lilly-Protocol/lily-sdk/security/advisories/new

Do **not** open a public GitHub issue, pull request, or discussion for a
security-sensitive report.

Include:

- Affected package version or commit
- Impact (funds, auth tokens, identity, availability)
- Reproduction steps or a proof of concept
- Any suggested fix you already have

## Response

- Acknowledgement: within 3 business days
- Initial triage / severity: within 7 days of acknowledgement
- Fix or mitigation plan: as soon as a patch can be verified, coordinated with the reporter before public disclosure

Please give us a reasonable window to ship a fix before you disclose the issue publicly.

Enabling GitHub Private Vulnerability Reporting / Security Advisories on the repository is a maintainer action (acceptance criterion for operators). This file is the contributor-facing policy and reporting channel.

## Safe disclosure guidance

- Do not test against production wallets, live funds, or third-party personal data.
- Do not include secrets, private keys, or customer payloads in the report beyond what is required to reproduce.
- Prefer a local or sandbox reproduction.
