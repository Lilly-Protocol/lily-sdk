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

## Configuration Reference

The SDK is configured via the `LilySdkConfig` object passed to the client constructor. All fields are optional and fall back to sensible defaults.

| Option | Type | Default | Description |
|---|---|---|---|
| `baseUrl` | `string` | `https://api.lillyprotocol.com` | Base URL for all API requests. Override for self-hosted or staging environments. |
| `apiKey` | `string` | — | API key for authentication. Required unless `authToken` is provided. |
| `authToken` | `string` | — | Bearer token for authentication. Takes precedence over `apiKey` when both are set. |
| `timeoutMs` | `number` | `10000` | Request timeout in milliseconds. Applies per-attempt, not across retries. |
| `retry.maxAttempts` | `number` | `2` | Maximum number of retry attempts for eligible requests. Set to `0` to disable retries. |
| `retry.delayMs` | `number` | `250` | Base delay between retries in milliseconds. Actual delay scales linearly with attempt number. |
| `retry.retryableStatusCodes` | `number[]` | `[408, 409, 425, 429, 500, 502, 503, 504]` | HTTP status codes that trigger a retry. Only applies to idempotent methods. |
| `defaultHeaders` | `Record<string, string>` | `{}` | Headers merged into every request. Overridden by per-request headers. |
| `userAgent` | `string` | `lily-sdk/<version>` | User-Agent header value. |
| `fetch` | `typeof fetch` | Global `fetch` | Custom fetch implementation. Useful for testing or non-standard runtimes. |

### Retry Semantics

Retries apply only to **idempotent** HTTP methods (`GET`, `PUT`, `DELETE`, `HEAD`, `OPTIONS`). `POST` and `PATCH` requests are never retried automatically because they may have side effects.

A request is retried when:

- The response status code is in `retry.retryableStatusCodes`, **or**
- A transport-level error occurs (network failure, DNS resolution error, timeout).

The delay between attempts uses **linear backoff**: `delayMs × attemptNumber`. For the default configuration this produces a 250 ms wait before the first retry and a 500 ms wait before the second.

```ts
const client = new LilyClient({
  baseUrl: 'https://api.example.com',
  apiKey: process.env.LILLY_API_KEY,
  timeoutMs: 5000,
  retry: {
    maxAttempts: 3,
    delayMs: 500,
    retryableStatusCodes: [429, 500, 502, 503],
  },
});
```

## Roadmap Themes

- Real backend endpoint alignment and response model hardening
- Pagination helpers and richer idempotency ergonomics
- Webhook verification, observability hooks, and advanced auth flows
- More complete Stellar asset and payment orchestration coverage

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.
