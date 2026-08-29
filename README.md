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

## Configuration

Pass a `LilySdkConfig` object to `new LilySdk(...)`. The constructor validates and resolves defaults via `resolveLilySdkConfig`.

| Option | Default | Notes |
| --- | --- | --- |
| `baseUrl` | *(required)* | Absolute URL. A trailing slash is added if missing. |
| `apiKey` | `undefined` | Sent as `x-api-key` when set. |
| `authToken` | `undefined` | Sent as `Authorization: Bearer …` when set. |
| `timeoutMs` | `10000` | Finite number greater than `0`. |
| `retry.retries` | `2` | Non-negative integer. |
| `retry.retryDelayMs` | `250` | Non-negative finite number (milliseconds). |
| `retry.retryableStatusCodes` | `[408, 409, 425, 429, 500, 502, 503, 504]` | Default retry status set. |
| `defaultHeaders` | `{}` | Merged into every request; per-request headers override. |
| `userAgent` | `lily-sdk/0.1.0` | Sent as the `user-agent` header. |
| `fetch` | `globalThis.fetch` | Must be a function. Pass an implementation in runtimes without `fetch`. |

Invalid `baseUrl`, non-positive `timeoutMs`, a missing `fetch`, a negative or non-integer `retry.retries`, or a negative `retry.retryDelayMs` throw `LilyConfigError`.

### Timeouts

SDK-level `timeoutMs` applies to every HTTP call. Individual transport requests may set `HttpRequest.timeoutMs`, which overrides the SDK default for that call (`request.timeoutMs ?? config.timeoutMs`).

### Retries

Retries apply **only to `GET`, `PUT`, and `DELETE`**. `POST` and `PATCH` are never retried.

Eligible methods are retried on HTTP status `408`, `409`, `425`, `429`, `500`, `502`, `503`, and `504`, and on network transport errors. Timeouts abort the request and are not retried.

Delay grows linearly: `retryDelayMs * attempt`. With the defaults that is 250ms before the first retry and 500ms before the second.

```ts
import { LilySdk } from '@lily-protocol/sdk';

const sdk = new LilySdk({
  baseUrl: 'https://api.lilyprotocol.com',
  timeoutMs: 15_000,
  retry: {
    retries: 3,
    retryDelayMs: 400,
    retryableStatusCodes: [408, 409, 425, 429, 500, 502, 503, 504],
  },
  defaultHeaders: {
    'x-request-source': 'billing-service',
  },
});
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

## Roadmap Themes

- Real backend endpoint alignment and response model hardening
- Pagination helpers and richer idempotency ergonomics
- Webhook verification, observability hooks, and advanced auth flows
- More complete Stellar asset and payment orchestration coverage

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.
