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

## HTTP Response Data

The HTTP client preserves the response status separately from the parsed `data` value:

| Response | `HttpResponse.data` |
| --- | --- |
| `204 No Content` | `null` |
| A response with an `application/json` content type | The parsed JSON value (object, array, primitive, or `null`) |
| Any other content type, including `text/plain` or `text/html` | The raw response body as a string |

Always check `status` before interpreting `data`. A successful response and an error response can both contain JSON or text, so the data shape alone does not indicate whether the request succeeded:

```ts
const response = await sdk.system.health();

if (response.status >= 200 && response.status < 300) {
  // `response.data` is the successful payload; a 204 response has `data === null`.
  console.log(response.data);
} else {
  // Error payloads may be parsed JSON or raw text, depending on Content-Type.
  console.error(`Request failed with HTTP ${response.status}`, response.data);
}
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
