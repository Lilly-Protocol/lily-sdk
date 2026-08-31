# Lily SDK

[![CI](https://github.com/lily-protocol/lily-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/lily-protocol/lily-sdk/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/typed-TypeScript-3178C6.svg)](https://www.typescriptlang.org/)

TypeScript-first SDK for integrating Lily Protocol's autonomous agent finance infrastructure into Node.js applications.

The SDK is designed for backend and service-to-service integrations that need typed access to AgentLily wallets, agent identity, autonomous payments, and Lily backend APIs on Stellar.

## Status

This repository is production-oriented foundation work. The public API, tooling, and contributor workflow are in place, while several domain methods still use intentionally conservative request models so the SDK can evolve alongside the backend without breaking contributors every week.

## Features

- Typed SDK constructor with strict configuration validation
- Modular clients for agents, wallets, payments, identity, and system health
- Reusable HTTP transport abstraction with auth header handling, timeouts, and retry scaffolding
- ESM and CommonJS builds with emitted declaration files
- Vitest test suite, ESLint, Prettier, and GitHub Actions CI
- Contributor-ready project docs, issue templates, and example script

## Installation

```bash
npm install @lily-protocol/sdk
```

For local development in this repository:

```bash
npm install
```

## Quick Start

```ts
import { LilySdk } from '@lily-protocol/sdk';

const sdk = new LilySdk({
  baseUrl: 'https://api.lilyprotocol.com',
  authToken: process.env.LILY_AUTH_TOKEN,
  apiKey: process.env.LILY_API_KEY,
});

const health = await sdk.system.health();
const wallet = await sdk.wallets.provision({
  agentId: 'agent_123',
  network: 'stellar-testnet',
});

console.log(health.status);
console.log(wallet.wallet.address);
```

## Public API Overview

```ts
import { LilySdk } from '@lily-protocol/sdk';

const sdk = new LilySdk({ baseUrl: 'https://api.lilyprotocol.com' });

sdk.agents.list();
sdk.wallets.provision({ agentId: 'agent_123', network: 'stellar-testnet' });
sdk.payments.quote({
  fromWalletId: 'wallet_123',
  toAddress: 'GB...',
  amount: { assetCode: 'USDC', amount: '10.00' },
});
sdk.identity.resolve({ agentId: 'agent_123' });
sdk.system.health();
```

## Repository Structure

```text
src/
  clients/       domain-oriented SDK modules
  config/        SDK configuration types and resolution
  errors/        typed SDK error hierarchy
  http/          transport abstraction and fetch implementation
  models/        public request/response and domain model types
  types/         client contracts and shared public contracts
tests/           unit tests and test helpers
examples/        runnable local examples
.github/         CI and contributor workflow templates
```

## Development

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

Run the example:

```bash
npm run example
```

## Design Notes

- `LilySdk` composes a shared transport with focused domain clients instead of exposing a single massive client surface.
- Models are exported from stable entrypoints so future internal refactors do not require a public breaking change.
- The HTTP layer is intentionally small and swappable, which keeps backend integration work easy to test and contributor-friendly.

## Error Handling

The SDK exports a typed error hierarchy rooted at `LilySdkError`. Every error carries optional `code`, `statusCode`, `details`, and `cause` fields for programmatic handling.

| Error Class | When It Is Thrown | Key Fields |
|---|---|---|
| `LilySdkError` | Base class for all SDK errors. Catch this as a fallback. | `code`, `cause` |
| `LilyConfigError` | Invalid or missing configuration at construction time. | `code`, `details` |
| `LilyTransportError` | Network failure, DNS error, timeout, or aborted request. | `code` (e.g. `TIMEOUT`, `NETWORK`), `cause` |
| `LilyValidationError` | Request payload failed client-side validation before sending. | `code`, `details` |
| `LilyAuthenticationError` | API returned `401` or `403`. | `statusCode`, `code`, `details` |
| `LilyApiError` | API returned any other non-2xx status (`400`, `404`, `500`, etc.). | `statusCode`, `code`, `details` |

### Catching Errors

Use `instanceof` to distinguish error types. Always check `statusCode` on API errors and `code` on transport errors.

```ts
import {
  LilyApiError,
  LilyAuthenticationError,
  LilyTransportError,
} from 'lily-sdk';

try {
  const wallet = await sdk.wallets.get('wal_abc123');
} catch (err) {
  if (err instanceof LilyAuthenticationError) {
    // 401/403 — refresh token or re-authenticate
    console.error('Auth failed:', err.statusCode, err.details);
  } else if (err instanceof LilyApiError) {
    // Business logic error from the API
    console.error(`API ${err.statusCode}: [${err.code}] ${err.message}`);
  } else if (err instanceof LilyTransportError) {
    // Network-level failure; retries may have been exhausted
    console.error('Transport:', err.code, err.cause);
  } else {
    throw err; // Unexpected error — rethrow
  }
}
```

### Error Fields Reference

- **`code`** (`string | undefined`): Machine-readable error identifier. Transport errors use codes like `TIMEOUT`, `NETWORK`, `ABORTED`. API errors mirror the backend error code when available.
- **`statusCode`** (`number | undefined`): HTTP status code for `LilyApiError` and `LilyAuthenticationError`. Undefined for transport and config errors.
- **`details`** (`unknown`): Structured payload from the API response body or validation context. Shape depends on the endpoint.
- **`cause`** (`unknown`): Original error that triggered this one (e.g., the underlying `fetch` error for transport failures). Useful for logging and debugging.

## Roadmap Themes

- Real backend endpoint alignment and response model hardening
- Pagination helpers and richer idempotency ergonomics
- Webhook verification, observability hooks, and advanced auth flows
- More complete Stellar asset and payment orchestration coverage

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.
